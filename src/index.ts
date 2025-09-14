#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { registerCommands } from './commands';
import { startInteractiveMode } from './commands/search';

// Load environment variables
dotenv.config();

// Check for empty arguments early - before Commander gets involved
if (process.argv.length <= 2) {
  console.log('DEBUG: Starting interactive mode from index.ts');
  startInteractiveMode();
} else {
  // Only set up and parse Commander if we have arguments
  const program = new Command();

  // Setup CLI program metadata
  program
    .name('soundbored')
    .description('CLI tool for fuzzy searching and playing sounds from Soundbored API')
    .version('0.1.0');

  // Register all commands
  registerCommands(program);

  // Global error handling
  program.exitOverride((err) => {
    if (err.code === 'commander.missingArgument') {
      console.error(chalk.red(`Error: ${err.message}`));
    }
    process.exit(1);
  });

  // Parse arguments
  program.parse(process.argv);
}
