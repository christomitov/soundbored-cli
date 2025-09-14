import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ensureUserConfig, loadUserConfig, saveUserConfig, getConfigPath, normalizeApiBaseUrl, apiBaseToBaseUrl } from '../services/userConfig';

const redact = (token: string) => (token.length <= 8 ? '*'.repeat(token.length) : token.slice(0, 4) + '*'.repeat(token.length - 8) + token.slice(-4));

export const configCommand = (program: Command): void => {
  program
    .command('config')
    .description('View or update stored API config')
    .option('--show', 'Show current configuration')
    .option('--api <url>', 'Set base URL')
    .option('--token <token>', 'Set API token')
    .action(async (opts: { show?: boolean; api?: string; token?: string }) => {
      // Ensure config dir exists or load existing
      let cfg = await loadUserConfig();

      if (opts.show) {
        if (!cfg) cfg = await ensureUserConfig();
        console.log(chalk.bold('Config path:'), getConfigPath());
        console.log('Base URL:', apiBaseToBaseUrl(cfg.apiBaseUrl));
        console.log('API token:', redact(cfg.token));
        return;
      }

      if (opts.api || opts.token) {
        if (!cfg) cfg = await ensureUserConfig();
        const next = {
          ...cfg,
          apiBaseUrl: opts.api ? normalizeApiBaseUrl(String(opts.api)) : cfg.apiBaseUrl,
          token: opts.token ? String(opts.token).trim() : cfg.token,
        };
        await saveUserConfig(next);
        console.log(chalk.green('✓ Configuration updated'));
        return;
      }

      // Interactive update
      if (!cfg) cfg = await ensureUserConfig();
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'baseUrl',
          message: 'Base URL:',
          default: apiBaseToBaseUrl(cfg.apiBaseUrl),
          validate: (input: string) => (input && input.startsWith('http') ? true : 'Enter a valid URL'),
        },
        {
          type: 'password',
          name: 'token',
          mask: '*',
          message: 'API token:',
          default: cfg.token,
          validate: (input: string) => (input ? true : 'Token is required'),
        },
      ]);

      await saveUserConfig({ apiBaseUrl: normalizeApiBaseUrl(answers.baseUrl), token: answers.token.trim() });
      console.log(chalk.green('✓ Configuration saved'));
    });
};
