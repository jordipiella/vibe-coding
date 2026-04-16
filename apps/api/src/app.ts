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
      timestamp: Date.now(),
    });
  });

  app.get('/status', async (_request, reply) => {
    const data = await fetch('http://localhost:3000/health').then(r => r.json());
    reply.send(data);
  });

  return app;
}

