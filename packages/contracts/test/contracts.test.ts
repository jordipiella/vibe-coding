import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from '../src/index';

describe('healthResponseSchema', () => {
  it('accepts the API health payload', () => {
    const parsed = healthResponseSchema.parse({
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    });

    expect(parsed.status).toBe('ok');
    expect(parsed.service).toBe('api');
  });
});

