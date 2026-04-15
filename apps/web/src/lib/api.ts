import { healthResponseSchema, type HealthResponse } from '@vibe/contracts';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return healthResponseSchema.parse(await response.json());
}

