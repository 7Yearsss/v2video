import { describe, it, expect } from 'vitest';
import { buildApp } from './app.js';

describe('server', () => {
  it('GET /health 返回 ok', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('POST /polish 缺 rawText 返回 400', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/polish', payload: {} });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('POST /storyboard 返回至少一镜', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/storyboard', payload: { polishedText: '你好' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().scenes.length).toBeGreaterThanOrEqual(1);
    await app.close();
  });
});
