import type { Project } from '@v2video/shared-types';
import type { RenderTimeline, SceneClip } from './timeline.js';

export function compileProject(project: Project): RenderTimeline {
  const ordered = [...project.scenes].sort((a, b) => a.order - b.order);
  const clips: SceneClip[] = [];
  let cursor = 0;
  for (const scene of ordered) {
    clips.push({
      sceneId: scene.id,
      startSec: cursor,
      durationSec: scene.durationSec,
      transition: scene.transition,
      layers: [
        { kind: 'asset', assetId: scene.assetId },
        { kind: 'subtitle', text: scene.narration },
      ],
    });
    cursor += scene.durationSec;
  }
  return { totalDurationSec: cursor, clips };
}
