#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const releaseDir = path.join(root, 'release');

const readJson = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));

async function main() {
  const pkgPath = path.join(root, 'package.json');
  const pkg = await readJson(pkgPath);

  // Ensure build artifacts exist
  const binSrc = path.join(root, 'bin', 'soundbored');
  const distSrc = path.join(root, 'dist', 'cli.js');
  try {
    await fs.access(binSrc);
    await fs.access(distSrc);
  } catch {
    console.error('Build artifacts missing. Run `npm run build` first.');
    process.exit(1);
  }

  // Prepare release dir structure
  await fs.rm(releaseDir, { recursive: true, force: true });
  await fs.mkdir(path.join(releaseDir, 'bin'), { recursive: true });
  await fs.mkdir(path.join(releaseDir, 'dist'), { recursive: true });

  // Copy artifacts
  await fs.copyFile(binSrc, path.join(releaseDir, 'bin', 'soundbored'));
  await fs.copyFile(distSrc, path.join(releaseDir, 'dist', 'cli.js'));

  // Minimal package.json for publish
  const releasePkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: 'module',
    main: 'dist/cli.js',
    bin: { soundbored: 'bin/soundbored' },
    engines: pkg.engines,
    license: pkg.license,
    keywords: pkg.keywords,
  };

  await fs.writeFile(
    path.join(releaseDir, 'package.json'),
    JSON.stringify(releasePkg, null, 2) + '\n',
    'utf8'
  );

  console.log('Release folder prepared at ./release');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

