import type { Asset } from '@v2video/shared-types';

const BASE = 'https://api.pexels.com';

function headers() {
  return { Authorization: process.env.PEXELS_API_KEY ?? '' };
}

export async function searchPexelsPhotos(q: string, perPage: number): Promise<Asset[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  const url = `${BASE}/v1/search?query=${encodeURIComponent(q)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    photos: Array<{
      id: number;
      width: number;
      height: number;
      alt: string;
      src: { large: string; medium: string };
    }>;
  };

  return data.photos.map((p) => ({
    id: `pexels-${p.id}`,
    scope: 'global' as const,
    type: 'image' as const,
    source: 'pexels' as const,
    url: p.src.large,
    thumbnailUrl: p.src.medium,
    width: p.width,
    height: p.height,
    tags: p.alt ? p.alt.split(' ').slice(0, 5) : [],
    createdAt: new Date().toISOString(),
  }));
}

export async function searchPexelsVideos(q: string, perPage: number): Promise<Asset[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  const url = `${BASE}/videos/search?query=${encodeURIComponent(q)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    videos: Array<{
      id: number;
      width: number;
      height: number;
      duration: number;
      image: string;
      video_files: Array<{ link: string; quality: string; width: number; height: number }>;
    }>;
  };

  return data.videos.map((v) => {
    const best = v.video_files
      .filter((f) => f.width && f.height)
      .sort((a, b) => b.width - a.width)[0];
    return {
      id: `pexels-video-${v.id}`,
      scope: 'global' as const,
      type: 'video' as const,
      source: 'pexels' as const,
      url: best?.link ?? '',
      thumbnailUrl: v.image,
      durationSec: v.duration,
      width: best?.width ?? v.width,
      height: best?.height ?? v.height,
      tags: [],
      createdAt: new Date().toISOString(),
    };
  });
}
