export function buildPolishPrompt(rawText: string): string {
  return [
    '你是短视频文案编辑。把下面的原始文本润色成口播脚本:',
    '- 口语化、有节奏、适合配音',
    '- 保留原意,不要编造事实',
    '- 只返回润色后的正文,不要解释',
    '',
    '原始文本:',
    rawText,
  ].join('\n');
}

export function buildStoryboardPrompt(polishedText: string): string {
  return [
    '把下面的口播脚本拆成分镜。每个分镜给出:',
    '- narration: 该镜的文案(也是字幕)',
    '- durationSec: 预估时长(秒,正数)',
    '- transition: none | fade | slide | zoom 之一',
    '- suggestedKeywords: 2-4 个英文素材搜索关键词',
    '',
    '只返回 JSON,形如 {"scenes":[...]},不要解释。',
    '',
    '脚本:',
    polishedText,
  ].join('\n');
}
