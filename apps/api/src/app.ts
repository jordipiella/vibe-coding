import Fastify from 'fastify';

import { healthResponseSchema } from '@vibe/contracts';

export function createApp() {
  const app = Fastify({
    logger: true,
  });

  app.get('/health', async (_request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');

    return healthResponseSchema.parse({
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

