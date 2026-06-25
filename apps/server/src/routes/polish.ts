import type { FastifyInstance } from 'fastify';
import { buildPolishPrompt } from '@v2video/prompt-kit';
import { chat } from '../lib/ai.js';

export async function polishRoutes(app: FastifyInstance) {
  app.post('/polish', async (req, reply) => {
    const body = req.body as { rawText?: string };
    if (!body?.rawText) return reply.code(400).send({ error: 'rawText required' });

    try {
      const polishedText = await chat([
        { role: 'user', content: buildPolishPrompt(body.rawText) },
      ]);
      return { polishedText };
    } catch (err) {
      app.log.error(err);
      return reply.code(502).send({ error: 'AI service error' });
    }
  });
}
