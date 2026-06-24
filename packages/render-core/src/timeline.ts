import type { TransitionType } from '@v2video/shared-types';

export interface AssetLayer {
  kind: 'asset';
  assetId: string | null;   // null = 待选,渲染时显示占位
}

export interface SubtitleLayer {
  kind: 'subtitle';
  text: string;
}

export type Layer = AssetLayer | SubtitleLayer;

export interface SceneClip {
  sceneId: string;
  startSec: number;         // 在整片时间轴上的起点
  durationSec: number;
  transition: TransitionType;
  layers: Layer[];          // 底层在前:[asset, subtitle]
}

export interface RenderTimeline {
  totalDurationSec: number;
  clips: SceneClip[];
}
