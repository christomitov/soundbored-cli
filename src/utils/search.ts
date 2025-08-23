import Fuse from 'fuse.js';
import { Sound } from '../types';

// Configure Fuse.js options for fuzzy search
const fuseOptions = {
  keys: ['filename', 'tags'],
  threshold: 0.4, // Lower threshold = stricter matching
  includeScore: true,
};

/**
 * Create a new fuzzy search instance
 */
export const createFuzzySearch = (sounds: Sound[]): Fuse<Sound> => {
  return new Fuse(sounds, fuseOptions);
};

/**
 * Perform a search and return ranked results
 */
export const searchSounds = (fuse: Fuse<Sound>, query: string, limit: number = 10): Sound[] => {
  if (!query.trim()) {
    // If no query, return first 'limit' sounds
    return (fuse as any)._docs.slice(0, limit);
  }

  const results = fuse.search(query);
  return results.slice(0, limit).map((result) => result.item);
};
