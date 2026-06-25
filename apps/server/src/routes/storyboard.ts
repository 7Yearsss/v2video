import type { FastifyInstance } from 'fastify';
import { buildStoryboardPrompt, parseStoryboard } from '@v2video/prompt-kit';
import { chat } from '../lib/ai.js';

export async function storyboardRoutes(app: FastifyInstance) {
  app.post('/storyboard', async (req, reply) => {
    const body = req.body as { polishedText?: string };
    if (!body?.polishedText) return reply.code(400).send({ error: 'polishedText required' });

    try {
      const raw = await chat([
        { role: 'user', content: buildStoryboardPrompt(body.polishedText) },
      ]);
      const result = parseStoryboard(raw);
      return result;
    } catch (err) {
      app.log.error(err);
      return reply.code(502).send({ error: 'AI service error or invalid JSON from model' });
    }
  });
}
