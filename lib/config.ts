/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint (without leading slash)
 * @returns The full API URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Ensure endpoint doesn't start with a slash and baseUrl ends with a slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  
  return `${cleanBaseUrl}${cleanEndpoint}`;
}

/**
 * Get the frontend URL
 * @returns The frontend URL
 */
export function getFrontendUrl(): string {
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
}

/**
 * Get environment variables
 */
export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  skipAuthVerification: process.env.NEXT_PUBLIC_SKIP_AUTH_VERIFICATION === 'true',
}; 