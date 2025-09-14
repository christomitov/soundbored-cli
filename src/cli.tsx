#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import App from './components/App';
import { ensureUserConfig } from './services/userConfig';
import { registerCommands } from './commands';

// Load environment variables
dotenv.config();

const program = new Command();

// Setup CLI program metadata
program
  .name('soundbored')
  .description('CLI tool for fuzzy searching and playing sounds from SoundBored API')
  .version('0.1.0');

// Interactive mode (default when no args)
program
  .argument('[query]', 'Initial search query')
  .action(async (query) => {
    // Check if we can use raw mode (required for Ink)
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.error(chalk.red('Error: This CLI requires an interactive terminal (TTY).'));
      console.error(chalk.yellow('Please run soundbored directly in your terminal, not through pipes or redirects.'));
      process.exit(1);
    }

    // Check if raw mode is supported
    if (process.stdin.setRawMode === undefined) {
      console.error(chalk.red('Error: Raw mode is not supported in this terminal.'));
      console.error(chalk.yellow('Try running in a different terminal or check your terminal settings.'));
      process.exit(1);
    }

    try {
      // Ensure user config is set up before starting UI
      await ensureUserConfig();
      // Start the React Ink app with exitOnCtrlC disabled
      const app = render(<App initialQuery={query} />, {
        exitOnCtrlC: false  // We'll handle Ctrl+C ourselves
      });
    } catch (error) {
      console.error(chalk.red('Failed to start the interactive UI:'), error);
      console.error(chalk.yellow('\nTry running the command directly in your terminal.'));
      process.exit(1);
    }
  });

// Register subcommands (e.g., config, search)
registerCommands(program);

// Parse arguments
program.parse(process.argv);
