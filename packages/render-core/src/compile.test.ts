import { describe, it, expect } from 'vitest';
import type { Project } from '@v2video/shared-types';
import { compileProject } from './compile.js';

function makeProject(): Project {
  return {
    id: 'p1', title: 't', rawText: '', polishedText: '',
    settings: {
      aspectRatio: '9:16',
      subtitle: { fontFamily: 'System', fontSize: 32, color: '#fff', strokeColor: '#000', position: 'bottom' },
      voiceover: null,
    },
    createdAt: '', updatedAt: '',
    scenes: [
      { id: 's1', projectId: 'p1', order: 0, narration: '第一句', durationSec: 3, assetId: 'a1', transition: 'fade', suggestedKeywords: [], suggestedAssetIds: [] },
      { id: 's2', projectId: 'p1', order: 1, narration: '第二句', durationSec: 2, assetId: null, transition: 'none', suggestedKeywords: [], suggestedAssetIds: [] },
    ],
  };
}

describe('compileProject', () => {
  it('按 order 顺序排布 clips,累加起点', () => {
    const tl = compileProject(makeProject());
    expect(tl.clips.map(c => c.sceneId)).toEqual(['s1', 's2']);
    expect(tl.clips[0].startSec).toBe(0);
    expect(tl.clips[1].startSec).toBe(3);
    expect(tl.totalDurationSec).toBe(5);
  });

  it('每个 clip 含 asset 层与 subtitle 层,字幕取 narration', () => {
    const tl = compileProject(makeProject());
    const layers = tl.clips[0].layers;
    expect(layers[0]).toEqual({ kind: 'asset', assetId: 'a1' });
    expect(layers[1]).toEqual({ kind: 'subtitle', text: '第一句' });
  });

  it('乱序的 scenes 也按 order 排序', () => {
    const p = makeProject();
    p.scenes = [p.scenes[1], p.scenes[0]]; // 倒序输入
    const tl = compileProject(p);
    expect(tl.clips.map(c => c.sceneId)).toEqual(['s1', 's2']);
  });
});
