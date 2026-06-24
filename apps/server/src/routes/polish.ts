import type { FastifyInstance } from 'fastify';

export async function polishRoutes(app: FastifyInstance) {
  app.post('/polish', async (req, reply) => {
    const body = req.body as { rawText?: string };
    if (!body?.rawText) return reply.code(400).send({ error: 'rawText required' });
    // M0 桩:原样回传,M1 接 Claude
    return { polishedText: body.rawText };
  });
}
