import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from '@vibe/contracts';

import { createApp } from '../src/app';

describe('GET /health', () => {
  it('returns a contract-compliant payload', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const payload = healthResponseSchema.parse(response.json());

    expect(payload.service).toBe('api');
    await app.close();
  });
});

