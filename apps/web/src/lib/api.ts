import { healthResponseSchema, type HealthResponse, pingResponseSchema, type PingResponse, versionResponseSchema, type VersionResponse } from '@vibe/contracts';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`);

  return healthResponseSchema.parse(await response.json());
}

export async function fetchPing(): Promise<PingResponse> {
  const response = await fetch(`${apiBaseUrl}/ping`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return pingResponseSchema.parse(await response.json());
}

export async function fetchVersion(): Promise<VersionResponse> {
  const response = await fetch(`${apiBaseUrl}/version`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return versionResponseSchema.parse(await response.json());
}
