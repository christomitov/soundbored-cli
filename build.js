#!/usr/bin/env node
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

build({
  entryPoints: [join(__dirname, 'src/cli.tsx')],
  bundle: true,
  platform: 'node',
  target: 'node16',
  outfile: join(__dirname, 'dist/cli.js'),
  format: 'esm',
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
}).catch(() => process.exit(1));
