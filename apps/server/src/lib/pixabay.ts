import type { Asset } from '@v2video/shared-types';

const BASE = 'https://pixabay.com/api';

export async function searchPixabayImages(q: string, perPage: number): Promise<Asset[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];

  const url = `${BASE}/?key=${key}&q=${encodeURIComponent(q)}&per_page=${perPage}&image_type=photo&safesearch=true`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    hits: Array<{
      id: number;
      largeImageURL: string;
      webformatURL: string;
      imageWidth: number;
      imageHeight: number;
      tags: string;
    }>;
  };

  return data.hits.map((h) => ({
    id: `pixabay-${h.id}`,
    scope: 'global' as const,
    type: 'image' as const,
    source: 'pixabay' as const,
    url: h.largeImageURL,
    thumbnailUrl: h.webformatURL,
    width: h.imageWidth,
    height: h.imageHeight,
    tags: h.tags.split(',').map((t) => t.trim()).slice(0, 5),
    createdAt: new Date().toISOString(),
  }));
}

export async function searchPixabayVideos(q: string, perPage: number): Promise<Asset[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];

  const url = `${BASE}/videos/?key=${key}&q=${encodeURIComponent(q)}&per_page=${perPage}&safesearch=true`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    hits: Array<{
      id: number;
      duration: number;
      userImageURL: string;
      tags: string;
      videos: {
        large: { url: string; width: number; height: number };
        medium: { url: string; width: number; height: number };
      };
    }>;
  };

  return data.hits.map((h) => {
    const v = h.videos.large?.url ? h.videos.large : h.videos.medium;
    return {
      id: `pixabay-video-${h.id}`,
      scope: 'global' as const,
      type: 'video' as const,
      source: 'pixabay' as const,
      url: v.url,
      thumbnailUrl: h.userImageURL,
      durationSec: h.duration,
      width: v.width,
      height: v.height,
      tags: h.tags.split(',').map((t) => t.trim()).slice(0, 5),
      createdAt: new Date().toISOString(),
    };
  });
}
