import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const pingResponseSchema = z.object({
  pong: z.literal(true),
});

export type PingResponse = z.infer<typeof pingResponseSchema>;

export const versionResponseSchema = z.object({
  version: z.string(),
  environment: z.enum(['development', 'production', 'test']),
});

export type VersionResponse = z.infer<typeof versionResponseSchema>;

export const apiErrorSchema = z.object({
  message: z.string(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

