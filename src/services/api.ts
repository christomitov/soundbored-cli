import axios from 'axios';
import { Sound, ApiResponse } from '../types';
import { ensureUserConfig } from './userConfig';

// Create axios instance using persisted user config
const createApiClient = async () => {
  const config = await ensureUserConfig();
  return axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Cache for sounds to avoid multiple API calls
let soundsCache: Sound[] | null = null;

/**
 * Fetch all sounds from the API
 */
export const fetchSounds = async (): Promise<Sound[]> => {
  // Return from cache if already fetched
  if (soundsCache) {
    return soundsCache;
  }

  try {
    const client = await createApiClient();
    const response = await client.get<ApiResponse>('/sounds');

    if (Array.isArray(response.data)) {
      // API returns an array directly
      soundsCache = response.data;
      return soundsCache;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // API returns data in a nested structure
      soundsCache = response.data.data;
      return soundsCache;
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API token.');
      } else {
        throw new Error(`API error: ${error.message}`);
      }
    }
    throw error;
  }
};

/**
 * Play a sound by ID
 */
export const playSound = async (id: number): Promise<void> => {
  try {
    const client = await createApiClient();
    await client.post(`/sounds/${id}/play`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API token.');
      } else if (error.response?.status === 404) {
        throw new Error(`Sound with ID ${id} not found.`);
      } else {
        throw new Error(`Failed to play sound: ${error.message}`);
      }
    }
    throw error;
  }
};
