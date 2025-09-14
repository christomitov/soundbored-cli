import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Config } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'soundbored');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure we always store the API base (with /api) regardless of user input
export function normalizeApiBaseUrl(input: string): string {
  let s = (input || '').trim();
  // Remove trailing slashes
  s = s.replace(/\/+$/g, '');
  // If user provided an API path already ending with /api, keep it
  if (s.endsWith('/api')) return s;
  // Otherwise, append /api
  return s + '/api';
}

export function apiBaseToBaseUrl(apiBaseUrl: string): string {
  const s = (apiBaseUrl || '').trim().replace(/\/+$/g, '');
  return s.endsWith('/api') ? s.slice(0, -4) : s;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export const loadUserConfig = async (): Promise<Config | null> => {
  if (!(await fileExists(CONFIG_FILE))) return null;
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.apiBaseUrl === 'string' && typeof parsed.token === 'string') {
      return parsed as Config;
    }
  } catch (e) {
    // fallthrough to prompt
  }
  return null;
};

export const saveUserConfig = async (config: Config): Promise<void> => {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
};

const promptForConfig = async (): Promise<Config> => {
  console.log(chalk.yellow('First-time setup: Configure Soundbored API access'));
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Base URL:',
      validate: (input: string) => (input && input.startsWith('http') ? true : 'Enter a valid URL'),
    },
    {
      type: 'password',
      name: 'token',
      mask: '*',
      message: 'API token:',
      validate: (input: string) => (input ? true : 'Token is required'),
    },
  ]);

  return {
    apiBaseUrl: normalizeApiBaseUrl(answers.baseUrl),
    token: answers.token.trim(),
  };
};

export const ensureUserConfig = async (): Promise<Config> => {
  // Prefer persisted config; fall back to envs if present, otherwise prompt
  const existing = await loadUserConfig();
  if (existing) return existing;

  const envBase = process.env.SOUNDBORED_API_BASE_URL || process.env.SOUNDBORED_BASE_URL;
  const envToken = process.env.SOUNDBORED_TOKEN;
  if (envBase && envToken) {
    const cfg: Config = { apiBaseUrl: normalizeApiBaseUrl(envBase), token: envToken };
    await saveUserConfig(cfg);
    return cfg;
  }

  const cfg = await promptForConfig();
  await saveUserConfig(cfg);
  return cfg;
};

export const getConfigPath = () => CONFIG_FILE;
