import fs from 'fs';
import path from 'path';
import { Command, InvalidArgumentError } from 'commander';
import chalk from 'chalk';
import { uploadSound } from '../services/api';
import { loadUserConfig, normalizeApiBaseUrl } from '../services/userConfig';

interface UploadCommandOptions {
  name?: string;
  tag?: string[];
  volume?: number;
  join?: boolean;
  dryRun?: boolean;
  json?: boolean;
}

const collectTag = (value: string, previous: string[]): string[] => [...previous, value];

const parseVolume = (value: string): number => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    throw new InvalidArgumentError('Volume must be an integer between 0 and 100.');
  }

  return parsed;
};

const deriveNameFromFile = (filePath: string): string => {
  const parsedName = path.parse(filePath).name.trim();
  return parsedName || path.basename(filePath);
};

const normalizeTags = (tags: string[]): string[] => {
  const trimmedTags = tags.map((tag) => tag.trim()).filter(Boolean);
  return [...new Set(trimmedTags)];
};

const ensureFileExists = async (filePath: string): Promise<fs.Stats> => {
  let stats: fs.Stats;

  try {
    stats = await fs.promises.stat(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }

  return stats;
};

const guessMimeType = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.m4a':
      return 'audio/mp4';
    case '.aac':
      return 'audio/aac';
    case '.flac':
      return 'audio/flac';
    default:
      return 'application/octet-stream';
  }
};

const extractUploadedSoundId = (payload: unknown): number | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const rootId = (payload as { id?: unknown }).id;
  if (typeof rootId === 'number') {
    return rootId;
  }

  const nested = (payload as { data?: unknown }).data;
  if (!nested || typeof nested !== 'object') {
    return null;
  }

  const nestedId = (nested as { id?: unknown }).id;
  return typeof nestedId === 'number' ? nestedId : null;
};

const resolveDryRunConfig = async (): Promise<{ uploadUrl: string | null; hasToken: boolean }> => {
  const storedConfig = await loadUserConfig();
  const envBaseUrl = process.env.SOUNDBORED_API_BASE_URL || process.env.SOUNDBORED_BASE_URL;
  const envToken = process.env.SOUNDBORED_TOKEN;

  const apiBaseUrl = envBaseUrl
    ? normalizeApiBaseUrl(envBaseUrl)
    : storedConfig?.apiBaseUrl || null;

  const token = (envToken || storedConfig?.token || '').trim();

  return {
    uploadUrl: apiBaseUrl ? `${apiBaseUrl}/sounds` : null,
    hasToken: Boolean(token),
  };
};

const printDryRun = async ({
  filePath,
  fileSizeBytes,
  name,
  tags,
  volume,
  isJoinSound,
  asJson,
}: {
  filePath: string;
  fileSizeBytes: number;
  name: string;
  tags: string[];
  volume?: number;
  isJoinSound: boolean;
  asJson?: boolean;
}): Promise<void> => {
  const { uploadUrl, hasToken } = await resolveDryRunConfig();

  const payload = {
    ok: true,
    dryRun: true,
    request: {
      method: 'POST',
      url: uploadUrl,
      authConfigured: hasToken,
      formData: {
        source_type: 'local',
        name,
        file: {
          path: filePath,
          filename: path.basename(filePath),
          mimeType: guessMimeType(filePath),
          sizeBytes: fileSizeBytes,
        },
        tags,
        volume: typeof volume === 'number' ? volume : null,
        is_join_sound: isJoinSound,
      },
    },
    note: 'Dry run only. No network request was made.',
  };

  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(chalk.yellow('Dry run only. No network request was made.'));
  console.log(chalk.cyan('Would send: POST /api/sounds'));
  console.log(`  URL: ${uploadUrl || '(missing SOUNDBORED_BASE_URL configuration)'}`);
  console.log(`  Auth token configured: ${hasToken ? 'yes' : 'no'}`);
  console.log('  Form fields:');
  console.log('    source_type: local');
  console.log(`    name: ${name}`);
  console.log(`    file: ${filePath}`);
  console.log(`    mime_type: ${guessMimeType(filePath)}`);
  console.log(`    file_size_bytes: ${fileSizeBytes}`);
  console.log(`    tags[]: ${tags.length ? tags.join(', ') : '(none)'}`);
  console.log(`    volume: ${typeof volume === 'number' ? String(volume) : '(none)'}`);
  console.log(`    is_join_sound: ${isJoinSound ? 'true' : 'false'}`);
};

export const uploadCommand = (program: Command): void => {
  program
    .command('upload')
    .description('Upload a local audio file to /api/sounds using multipart form-data.')
    .argument('<file>', 'Path to local audio file (absolute or relative).')
    .option(
      '-n, --name <name>',
      'Sound name sent as form field `name`. Defaults to filename without extension.'
    )
    .option(
      '-t, --tag <tag>',
      'Tag sent as repeated form field `tags[]`. Repeat option for multiple tags.',
      collectTag,
      [] as string[]
    )
    .option('-v, --volume <0-100>', 'Volume sent as form field `volume`.', parseVolume)
    .option('--join', 'Send `is_join_sound=true`. Default is false when omitted.')
    .option('--dry-run', 'Print the exact request payload without uploading anything.')
    .option('--json', 'Print structured JSON output for agents/automation.')
    .addHelpText(
      'after',
      `
API mapping:
  source_type   = local (always)
  name          = --name (or derived from filename)
  file          = @<file argument>
  tags[]        = --tag (repeatable)
  volume        = --volume
  is_join_sound = --join

Examples:
  soundbored upload ./sounds/airhorn.mp3 --name "Airhorn" --tag meme --tag alert
  soundbored upload ./voice/join.wav --join --volume 80 --name "Welcome"
  soundbored upload ./clip.mp3 --dry-run
  soundbored upload ./clip.mp3 --json
`
    )
    .action(async (fileArg: string, options: UploadCommandOptions) => {
      const filePath = path.resolve(fileArg);
      const name = options.name?.trim() || deriveNameFromFile(filePath);
      const tags = normalizeTags(options.tag || []);

      try {
        const fileStats = await ensureFileExists(filePath);

        if (options.dryRun) {
          await printDryRun({
            filePath,
            fileSizeBytes: fileStats.size,
            name,
            tags,
            volume: options.volume,
            isJoinSound: Boolean(options.join),
            asJson: options.json,
          });
          return;
        }

        if (!options.json) {
          console.log(chalk.blue(`Uploading ${path.basename(filePath)}...`));
        }

        const result = await uploadSound({
          sourceType: 'local',
          filePath,
          name,
          tags,
          volume: options.volume,
          isJoinSound: Boolean(options.join),
        });

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                ok: true,
                status: result.status,
                filePath,
                name,
                tags,
                volume: options.volume,
                isJoinSound: Boolean(options.join),
                uploadedSoundId: extractUploadedSoundId(result.data),
                data: result.data,
              },
              null,
              2
            )
          );
          return;
        }

        console.log(chalk.green(`✓ Uploaded "${name}" successfully.`));
        const uploadedSoundId = extractUploadedSoundId(result.data);
        if (uploadedSoundId !== null) {
          console.log(chalk.green(`  Sound ID: ${uploadedSoundId}`));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (options.json) {
          console.error(
            JSON.stringify(
              {
                ok: false,
                error: message,
              },
              null,
              2
            )
          );
        } else {
          console.error(chalk.red(`Upload failed: ${message}`));
        }

        process.exit(1);
      }
    });
};
