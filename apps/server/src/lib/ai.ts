import OpenAI from 'openai';

export const ai = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY ?? '',
});

export const AI_MODEL = process.env.AI_MODEL ?? 'gpt-5.5';

/** OpenAI chat completion with provider-specific params */
export async function chat(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
  const res = await (ai.chat.completions.create as Function)({
    model: AI_MODEL,
    messages,
    reasoning_effort: 'high',
    disable_response_storage: true,
  });
  const content = (res as OpenAI.Chat.ChatCompletion).choices[0]?.message?.content;
  if (!content) throw new Error('AI returned empty content');
  return content;
}
