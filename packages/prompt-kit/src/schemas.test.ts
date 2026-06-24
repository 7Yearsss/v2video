import { describe, it, expect } from 'vitest';
import { storyboardSchema, parseStoryboard } from './schemas.js';

const valid = {
  scenes: [
    { narration: '钩子句', durationSec: 3, transition: 'fade', suggestedKeywords: ['city', 'night'] },
    { narration: '第二句', durationSec: 2, transition: 'none', suggestedKeywords: [] },
  ],
};

describe('storyboardSchema', () => {
  it('接受合法的分镜输出', () => {
    expect(() => storyboardSchema.parse(valid)).not.toThrow();
  });

  it('拒绝非法 transition', () => {
    const bad = { scenes: [{ narration: 'x', durationSec: 1, transition: 'explode', suggestedKeywords: [] }] };
    expect(() => storyboardSchema.parse(bad)).toThrow();
  });

  it('parseStoryboard 能从带 ```json 围栏的字符串里抽出 JSON', () => {
    const raw = '```json\n' + JSON.stringify(valid) + '\n```';
    const out = parseStoryboard(raw);
    expect(out.scenes).toHaveLength(2);
    expect(out.scenes[0].narration).toBe('钩子句');
  });
});
