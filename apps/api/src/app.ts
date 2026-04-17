import Fastify from 'fastify';

import { healthResponseSchema, pingResponseSchema, versionResponseSchema } from '@vibe/contracts';

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

  app.get('/ping', async (_request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    return pingResponseSchema.parse({ pong: true });
  });

  app.get('/version', async (_request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');

    return versionResponseSchema.parse({
      version: process.env.npm_package_version ?? '0.0.0',
      environment: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
    });
  });

  return app;
}

