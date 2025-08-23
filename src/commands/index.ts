import { Command } from 'commander';
import { searchCommand } from './search';

export const registerCommands = (program: Command): void => {
  // Add search command (default)
  searchCommand(program);

  // You can add more commands here in the future
};
