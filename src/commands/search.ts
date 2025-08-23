import { Command } from 'commander';
import inquirer from 'inquirer';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';
import chalk from 'chalk';
import { fetchSounds, playSound } from '../services/api';
import fuzzy from 'fuzzy';
import readline from 'readline';

// Register the autocomplete prompt with inquirer
inquirer.registerPrompt('autocomplete', inquirerAutocomplete);

// Global state to keep track of searches between prompts
let globalSearch = '';

// Keep track of Ctrl+C presses for double-exit
let lastCtrlCTime = 0;
const CTRL_C_TIMEOUT = 2000; // 2 seconds between presses for exit

// Flag to prevent multiple readline interfaces
let rlCreated = false;

// Export the interactive mode function
export const startInteractiveMode = async () => {
  try {
    console.log(chalk.green('✓ Loading sounds...'));
    const allSounds = await fetchSounds();
    console.log(chalk.green(`✓ Loaded ${allSounds.length} sounds`));
    
    // Function for interactive searching with fuzzy matching
    const searchSounds = async (input = '') => {
      // Use either provided input or saved global search
      const searchTerm = (input !== undefined ? input : globalSearch).toLowerCase();
      
      // If no search term, return all sounds
      if (!searchTerm) {
        return allSounds.map((sound) => ({
          name: `${sound.filename} ${sound.tags?.length ? chalk.blue(`[tags: ${sound.tags.join(', ')}]`) : ''}`,
          value: sound,
        }));
      }
      
      // Use fuzzy search for better matching
      const fuzzyResult = fuzzy.filter(searchTerm, allSounds, {
        extract: (sound) => `${sound.filename} ${sound.tags?.join(' ') || ''}`,
      });
      
      // Format the results
      return fuzzyResult.map((result) => ({
        name: `${result.original.filename} ${
          result.original.tags?.length
            ? chalk.blue(`[tags: ${result.original.tags.join(', ')}]`)
            : ''
        }`,
        value: result.original,
      }));
    };
    
    // Setup readline interface for proper SIGINT handling
    // Must be created after Inquirer is used
    if (!rlCreated) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      rl.on('SIGINT', () => {
        const now = Date.now();
        if (now - lastCtrlCTime < CTRL_C_TIMEOUT) {
          console.log(chalk.yellow('\nExiting application...'));
          process.exit(0);
        } else {
          lastCtrlCTime = now;
          globalSearch = '';
          console.log(chalk.yellow('\nSearch cleared. Press Ctrl+C again to exit.'));
          
          // Return to prevent the process from exiting
          return;
        }
      });
      
      rlCreated = true;
    }
    
    // Main search loop
    while (true) {
      try {
        // Prompt the user to search for a sound
        const { selectedSound } = await inquirer.prompt([
          {
            type: 'autocomplete',
            name: 'selectedSound',
            message: 'Search for a sound:',
            source: async (_: any, input: string | undefined) => {
              // If input is provided, update global search
              if (input !== undefined) {
                globalSearch = input;
              }
              return searchSounds(input);
            }
          }
        ]);
        
        // Handle the selected sound
        if (selectedSound) {
          console.log(chalk.cyan(`▶ Playing: ${selectedSound.filename}`));
          await playSound(selectedSound.id);
        }
      } catch (error) {
        // If inquirer was cancelled, just continue the loop
        if (error instanceof Error && error.message === 'Prompt was canceled') {
          continue;
        }
        
        // Log other errors but continue the loop
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

export const searchCommand = (program: Command): void => {
  // Register the search command
  program
    .command('search')
    .description('Search for sounds and play them')
    .argument('[query]', 'Initial search query (optional)')
    .option('-i, --interactive', 'Interactive mode')
    .action(async (query) => {
      try {
        // Check for token
        // if (!process.env.SOUNDBORED_TOKEN) {
        //   console.error(chalk.red('Error: SOUNDBORED_TOKEN environment variable is required'));
        //   console.log(chalk.yellow('Set it via environment variables or create a .env file'));
        //   process.exit(1);
        // }

        if (!query) {
          // Start interactive mode if no query is provided
          return startInteractiveMode();
        }

        console.log(chalk.blue('Fetching sounds...'));
        const sounds = await fetchSounds();
        console.log(chalk.green(`✓ Loaded ${sounds.length} sounds`));

        // Search for sounds matching the query
        const searchQuery = query.toLowerCase();
        const filteredSounds = sounds.filter((sound) => {
          // Check if query matches filename (case insensitive)
          const filenameMatch = sound.filename.toLowerCase().includes(searchQuery);

          // Check if query matches any tags (case insensitive)
          const tagMatch = sound.tags
            ? sound.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
            : false;

          // Return true if either filename or tags match
          return filenameMatch || tagMatch;
        });

        // Output the results
        if (searchQuery && filteredSounds.length === 0) {
          console.log(chalk.yellow(`No sounds found matching "${searchQuery}"`));
        } else {
          const message = searchQuery
            ? chalk.green(`Found ${filteredSounds.length} sounds matching "${searchQuery}":`)
            : chalk.green(`Found ${filteredSounds.length} sounds:`);

          console.log(message);

          filteredSounds.forEach((sound) => {
            const tags = sound.tags?.length ? chalk.blue(` [tags: ${sound.tags.join(', ')}]`) : '';
            console.log(`- ${sound.filename}${tags}`);
          });
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
};
