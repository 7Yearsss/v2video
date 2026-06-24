import Fastify, { type FastifyInstance } from 'fastify';
import { healthRoutes } from './routes/health.js';
import { polishRoutes } from './routes/polish.js';
import { storyboardRoutes } from './routes/storyboard.js';
import { assetRoutes } from './routes/assets.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(healthRoutes);
  app.register(polishRoutes);
  app.register(storyboardRoutes);
  app.register(assetRoutes);
  return app;
}
