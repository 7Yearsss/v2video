import type { FastifyInstance } from 'fastify';

export async function assetRoutes(app: FastifyInstance) {
  app.get('/assets/search', async (req, reply) => {
    const q = (req.query as { q?: string }).q;
    if (!q) return reply.code(400).send({ error: 'q required' });
    // M0 桩:空结果,M2 接 Pexels/Pixabay
    return { results: [] };
  });
}
