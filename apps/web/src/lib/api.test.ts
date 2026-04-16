import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchHealth } from './api';

describe('fetchHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses the health payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        service: 'api',
        timestamp: new Date().toISOString(),
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const payload = await fetchHealth();

    expect(payload.service).toBe('api');
  });

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchHealth()).rejects.toThrow('API request failed with status 500');
  });
});

