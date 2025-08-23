// Define the Sound object structure as returned by the API
export interface Sound {
  id: number;
  filename: string;
  tags?: string[];
  // Add other properties as needed
}

// API response structure
export interface ApiResponse {
  // The API might return either a nested structure or an array directly
  data?: Sound[];
  success?: boolean;
  message?: string;
}

// Alternative response when API returns array directly
export type ApiArrayResponse = Sound[];

// Configuration
export interface Config {
  apiBaseUrl: string;
  token: string;
}
