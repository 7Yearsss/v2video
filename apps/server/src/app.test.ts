import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock AI so tests never hit real network
vi.mock('./lib/ai.js', () => ({
  chat: vi.fn(),
}));

import { chat } from './lib/ai.js';
import { buildApp } from './app.js';

const mockChat = chat as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockChat.mockReset();
});

describe('GET /health', () => {
  it('返回 ok', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});

describe('POST /polish', () => {
  it('缺 rawText 返回 400', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/polish', payload: {} });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('返回 AI 润色文本', async () => {
    mockChat.mockResolvedValue('润色后的口播文案');
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/polish',
      payload: { rawText: '原始文本' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().polishedText).toBe('润色后的口播文案');
    await app.close();
  });

  it('AI 出错返回 502', async () => {
    mockChat.mockRejectedValue(new Error('network error'));
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/polish',
      payload: { rawText: '原始文本' },
    });
    expect(res.statusCode).toBe(502);
    await app.close();
  });
});

describe('POST /storyboard', () => {
  it('缺 polishedText 返回 400', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/storyboard', payload: {} });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('返回经 Zod 校验的分镜列表', async () => {
    mockChat.mockResolvedValue(
      JSON.stringify({
        scenes: [
          { narration: '测试镜头', durationSec: 3, transition: 'fade', suggestedKeywords: ['sky'] },
        ],
      })
    );
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/storyboard',
      payload: { polishedText: '测试文案' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.scenes).toHaveLength(1);
    expect(body.scenes[0].narration).toBe('测试镜头');
    await app.close();
  });

  it('AI 返回无效 JSON 时返回 502', async () => {
    mockChat.mockResolvedValue('这不是JSON');
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/storyboard',
      payload: { polishedText: '文案' },
    });
    expect(res.statusCode).toBe(502);
    await app.close();
  });
});

describe('GET /assets/search', () => {
  it('缺 q 参数返回 400', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/assets/search' });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('无 API key 时返回空数组', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/assets/search?q=sky' });
    expect(res.statusCode).toBe(200);
    expect(res.json().results).toEqual([]);
    await app.close();
  });

  it('type=video 时只返回视频', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/assets/search?q=nature&type=video' });
    expect(res.statusCode).toBe(200);
    const { results } = res.json();
    results.forEach((a: { type: string }) => expect(a.type).toBe('video'));
    await app.close();
  });
});
