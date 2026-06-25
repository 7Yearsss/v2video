import type { FastifyInstance } from 'fastify';
import type { AssetType } from '@v2video/shared-types';
import { searchPexelsPhotos, searchPexelsVideos } from '../lib/pexels.js';
import { searchPixabayImages, searchPixabayVideos } from '../lib/pixabay.js';

export async function assetRoutes(app: FastifyInstance) {
  app.get('/assets/search', async (req, reply) => {
    const { q, type = 'all', per_page = '10' } = req.query as {
      q?: string;
      type?: AssetType | 'all';
      per_page?: string;
    };

    if (!q) return reply.code(400).send({ error: 'q required' });

    const n = Math.min(Math.max(Number(per_page) || 10, 1), 40);
    const wantImage = type === 'all' || type === 'image';
    const wantVideo = type === 'all' || type === 'video';

    const [pexelsPhotos, pexelsVideos, pixabayImages, pixabayVideos] = await Promise.all([
      wantImage ? searchPexelsPhotos(q, n) : Promise.resolve([]),
      wantVideo ? searchPexelsVideos(q, n) : Promise.resolve([]),
      wantImage ? searchPixabayImages(q, n) : Promise.resolve([]),
      wantVideo ? searchPixabayVideos(q, n) : Promise.resolve([]),
    ]);

    const results = [...pexelsPhotos, ...pexelsVideos, ...pixabayImages, ...pixabayVideos];
    return { results };
  });
}
