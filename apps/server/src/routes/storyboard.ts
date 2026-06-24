import type { FastifyInstance } from 'fastify';

export async function storyboardRoutes(app: FastifyInstance) {
  app.post('/storyboard', async (req, reply) => {
    const body = req.body as { polishedText?: string };
    if (!body?.polishedText) return reply.code(400).send({ error: 'polishedText required' });
    // M0 桩:固定一镜,M1 接 Claude + prompt-kit 校验
    return {
      scenes: [
        { narration: body.polishedText, durationSec: 3, transition: 'fade', suggestedKeywords: [] },
      ],
    };
  });
}
