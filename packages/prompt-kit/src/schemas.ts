import { z } from 'zod';

export const storyboardSceneSchema = z.object({
  narration: z.string().min(1),
  durationSec: z.number().positive(),
  transition: z.enum(['none', 'fade', 'slide', 'zoom']),
  suggestedKeywords: z.array(z.string()),
});

export const storyboardSchema = z.object({
  scenes: z.array(storyboardSceneSchema).min(1),
});

export type StoryboardOutput = z.infer<typeof storyboardSchema>;

/** 从 LLM 返回(可能带 markdown 围栏)中抽取并校验分镜 JSON */
export function parseStoryboard(raw: string): StoryboardOutput {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = (fenced ? fenced[1] : raw).trim();
  const parsed = JSON.parse(jsonText);
  return storyboardSchema.parse(parsed);
}
