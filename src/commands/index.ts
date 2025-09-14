import { Command } from 'commander';
import { searchCommand } from './search';
import { configCommand } from './config';

export const registerCommands = (program: Command): void => {
  // Add search command (default)
  searchCommand(program);

  // Config command
  configCommand(program);
};
