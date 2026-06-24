export type AssetScope = 'global' | 'project';
export type AssetType = 'image' | 'video';
export type AssetSource = 'pexels' | 'pixabay' | 'upload';

export interface Asset {
  id: string;
  scope: AssetScope;
  projectId?: string;
  type: AssetType;
  source: AssetSource;
  url: string;
  thumbnailUrl: string;
  durationSec?: number;
  width: number;
  height: number;
  tags: string[];
  createdAt: string;
}

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom';

export interface Scene {
  id: string;
  projectId: string;
  order: number;
  narration: string;
  durationSec: number;
  assetId: string | null;
  transition: TransitionType;
  suggestedKeywords: string[];
  suggestedAssetIds: string[];
}

export type AspectRatio = '9:16' | '16:9' | '1:1';
export type SubtitlePosition = 'bottom' | 'center';

export interface ProjectSettings {
  aspectRatio: AspectRatio;
  subtitle: {
    fontFamily: string;
    fontSize: number;
    color: string;
    strokeColor: string;
    position: SubtitlePosition;
  };
  voiceover: null;
}

export interface Project {
  id: string;
  title: string;
  rawText: string;
  polishedText: string;
  scenes: Scene[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}
