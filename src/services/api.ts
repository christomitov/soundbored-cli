import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Sound, ApiResponse, UploadSoundInput, UploadSoundResult } from '../types';
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

const guessMimeType = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.m4a':
      return 'audio/mp4';
    case '.aac':
      return 'audio/aac';
    case '.flac':
      return 'audio/flac';
    default:
      return 'application/octet-stream';
  }
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.toLowerCase().includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

const extractApiMessage = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const maybeMessage = (value as { message?: unknown }).message;
  if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
    return maybeMessage.trim();
  }

  const maybeError = (value as { error?: unknown }).error;
  if (typeof maybeError === 'string' && maybeError.trim()) {
    return maybeError.trim();
  }

  return undefined;
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

/**
 * Upload a local file as a new sound.
 */
export const uploadSound = async (input: UploadSoundInput): Promise<UploadSoundResult> => {
  const config = await ensureUserConfig();
  const sourceType = input.sourceType || 'local';

  const bytes = await fs.promises.readFile(input.filePath);
  const blob = new Blob([bytes], { type: guessMimeType(input.filePath) });

  const formData = new FormData();
  formData.append('source_type', sourceType);
  formData.append('name', input.name);
  formData.append('file', blob, path.basename(input.filePath));

  input.tags?.forEach((tag) => {
    formData.append('tags[]', tag);
  });

  if (typeof input.volume === 'number') {
    formData.append('volume', String(input.volume));
  }

  if (typeof input.isJoinSound === 'boolean') {
    formData.append('is_join_sound', input.isJoinSound ? 'true' : 'false');
  }

  let response: Response;

  try {
    response = await fetch(`${config.apiBaseUrl}/sounds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      body: formData,
    });
  } catch (error) {
    throw new Error(
      `Network error while uploading sound: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const responseData = await parseResponseBody(response);

  if (!response.ok) {
    const apiMessage = extractApiMessage(responseData);

    if (response.status === 401) {
      throw new Error('Authentication failed. Please check your API token.');
    }

    throw new Error(
      apiMessage ||
        `Upload failed with status ${response.status} ${response.statusText || ''}`.trim()
    );
  }

  // Uploaded list changed; force next fetch to re-sync from API.
  soundsCache = null;

  return {
    status: response.status,
    data: responseData,
  };
};
