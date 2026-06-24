# Phase 1 — Milestone 0: Monorepo 脚手架与骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭出一个可运行、可类型检查、有测试的 pnpm monorepo 骨架(shared-types / render-core / prompt-kit / server / mobile),作为 Phase 1 三个里程碑的地基,并推到 GitHub。

**Architecture:** pnpm workspace,`node-linker=hoisted` 以兼容 Expo/Metro。纯 TS 包(shared-types/render-core/prompt-kit)用 tsc 构建、Vitest 测试。`render-core` 是渲染脊椎——把 `Project` 编译成声明式 `RenderTimeline`,预览与导出共用。后端是无状态 Fastify 薄代理,M0 阶段路由返回可测的桩数据。移动端是 Expo dev-client + expo-router 骨架,配好 monorepo Metro。

**Tech Stack:** pnpm, TypeScript, Vitest, Zod, Fastify, Expo (RN), expo-router

---

## File Structure

```
v2video/
├── package.json                      # 根:workspace 脚本
├── pnpm-workspace.yaml
├── .npmrc                            # node-linker=hoisted
├── tsconfig.base.json
├── .gitignore
├── README.md
├── packages/
│   ├── shared-types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/{index.ts, project.ts}
│   ├── render-core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/{index.ts, timeline.ts, compile.ts, compile.test.ts}
│   └── prompt-kit/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── src/{index.ts, schemas.ts, prompts.ts, schemas.test.ts}
└── apps/
    ├── server/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vitest.config.ts
    │   ├── .env.example
    │   └── src/{app.ts, server.ts, app.test.ts, routes/{health,polish,storyboard,assets}.ts}
    └── mobile/                       # 由 create-expo-app 生成后改造
        ├── package.json
        ├── metro.config.js           # monorepo 配置
        ├── app/{_layout.tsx, index.tsx}
        └── ...
```

每个包职责单一:`shared-types` 只放数据契约;`render-core` 只做 Project→Timeline 纯函数;`prompt-kit` 只管 prompt 与输出校验;`server` 只做转发;`mobile` 是 UI 壳。

---

## Task 1: 根 monorepo 骨架

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `tsconfig.base.json`, `.gitignore`, `README.md`

- [ ] **Step 1: 激活 pnpm(若未激活)**

Run: `corepack enable && pnpm -v`
Expected: 打印 `9.15.0`(或相近版本)

- [ ] **Step 2: 写 `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: 写 `.npmrc`**

Expo/Metro 在 pnpm 默认 symlink 布局下易出问题,用 hoisted 布局规避。

```
node-linker=hoisted
```

- [ ] **Step 4: 写根 `package.json`**

```json
{
  "name": "v2video",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "typecheck": "pnpm -r --filter=!mobile run typecheck && pnpm --filter mobile exec tsc --noEmit",
    "test": "pnpm -r run test",
    "build": "pnpm -r --filter=!mobile run build"
  },
  "devDependencies": {
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 5: 写 `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 6: 写 `.gitignore`**

```
node_modules/
dist/
.expo/
*.log
.env
.env.local
coverage/
.DS_Store
ios/
android/
```

- [ ] **Step 7: 写 `README.md`**

```markdown
# v2video

AI 驱动的短视频创作 App。文本 → AI 润色 → AI 分镜 → 选/传素材 → 类剪辑预览 → 导出 MP4。

设计文档见 `docs/superpowers/specs/`。

## 开发

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
```

- `packages/shared-types` — 前后端共用数据契约
- `packages/render-core` — Project → RenderTimeline(渲染脊椎)
- `packages/prompt-kit` — AI prompt 与输出校验
- `apps/server` — 无状态 Fastify 薄代理
- `apps/mobile` — Expo App
```

- [ ] **Step 8: 安装并提交**

Run: `pnpm install && git add -A && git commit -m "chore: monorepo root scaffolding"`
Expected: install 成功,commit 生成

---

## Task 2: packages/shared-types(数据契约)

**Files:**
- Create: `packages/shared-types/package.json`, `packages/shared-types/tsconfig.json`, `packages/shared-types/src/project.ts`, `packages/shared-types/src/index.ts`

- [ ] **Step 1: 写 `packages/shared-types/package.json`**

```json
{
  "name": "@v2video/shared-types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "echo \"no tests\" && exit 0"
  }
}
```

- [ ] **Step 2: 写 `packages/shared-types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 3: 写 `packages/shared-types/src/project.ts`**

```typescript
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
```

- [ ] **Step 4: 写 `packages/shared-types/src/index.ts`**

```typescript
export * from './project.js';
```

- [ ] **Step 5: 构建验证**

Run: `pnpm --filter @v2video/shared-types build`
Expected: 生成 `packages/shared-types/dist/index.js` 与 `index.d.ts`,无报错

- [ ] **Step 6: 提交**

```bash
git add packages/shared-types
git commit -m "feat(shared-types): project/scene/asset data contracts"
```

---

## Task 3: packages/render-core(渲染脊椎,TDD)

**Files:**
- Create: `packages/render-core/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/timeline.ts`, `src/compile.ts`, `src/index.ts`, `src/compile.test.ts`

- [ ] **Step 1: 写 `packages/render-core/package.json`**

```json
{
  "name": "@v2video/render-core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": { "@v2video/shared-types": "workspace:*" },
  "devDependencies": { "vitest": "^2.1.8" }
}
```

- [ ] **Step 2: 写 `packages/render-core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: 写 `packages/render-core/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
```

- [ ] **Step 4: 写 `packages/render-core/src/timeline.ts`(声明式时间轴类型)**

```typescript
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
```

- [ ] **Step 5: 写失败测试 `packages/render-core/src/compile.test.ts`**

```typescript
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
```

- [ ] **Step 6: 跑测试确认失败**

Run: `pnpm --filter @v2video/render-core test`
Expected: FAIL，提示 `compile.js` 找不到或 `compileProject` 未定义

- [ ] **Step 7: 写实现 `packages/render-core/src/compile.ts`**

```typescript
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
```

- [ ] **Step 8: 写 `packages/render-core/src/index.ts`**

```typescript
export * from './timeline.js';
export * from './compile.js';
```

- [ ] **Step 9: 跑测试确认通过**

Run: `pnpm --filter @v2video/render-core test`
Expected: PASS，3 个测试全绿

- [ ] **Step 10: 提交**

```bash
git add packages/render-core
git commit -m "feat(render-core): compile Project to declarative RenderTimeline"
```

---

## Task 4: packages/prompt-kit(prompt 与输出校验,TDD)

**Files:**
- Create: `packages/prompt-kit/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/schemas.ts`, `src/prompts.ts`, `src/index.ts`, `src/schemas.test.ts`

- [ ] **Step 1: 写 `packages/prompt-kit/package.json`**

```json
{
  "name": "@v2video/prompt-kit",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": { "zod": "^3.23.8" },
  "devDependencies": { "vitest": "^2.1.8" }
}
```

- [ ] **Step 2: 写 `packages/prompt-kit/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: 写 `packages/prompt-kit/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
```

- [ ] **Step 4: 写失败测试 `packages/prompt-kit/src/schemas.test.ts`**

```typescript
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
```

- [ ] **Step 5: 跑测试确认失败**

Run: `pnpm --filter @v2video/prompt-kit test`
Expected: FAIL，`schemas.js` 未找到

- [ ] **Step 6: 写实现 `packages/prompt-kit/src/schemas.ts`**

```typescript
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
```

- [ ] **Step 7: 写 `packages/prompt-kit/src/prompts.ts`**

```typescript
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
```

- [ ] **Step 8: 写 `packages/prompt-kit/src/index.ts`**

```typescript
export * from './schemas.js';
export * from './prompts.js';
```

- [ ] **Step 9: 跑测试确认通过**

Run: `pnpm --filter @v2video/prompt-kit test`
Expected: PASS，3 个测试全绿

- [ ] **Step 10: 提交**

```bash
git add packages/prompt-kit
git commit -m "feat(prompt-kit): polish/storyboard prompts and zod output validation"
```

---

## Task 5: apps/server(无状态 Fastify 薄代理,TDD)

**Files:**
- Create: `apps/server/package.json`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, `src/app.ts`, `src/server.ts`, `src/app.test.ts`, `src/routes/{health,polish,storyboard,assets}.ts`

M0 阶段路由返回桩数据(不真打 Claude/Pexels),保证可独立测试;真实转发在 M1/M2 接入。

- [ ] **Step 1: 写 `apps/server/package.json`**

```json
{
  "name": "@v2video/server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@v2video/prompt-kit": "workspace:*",
    "@v2video/shared-types": "workspace:*",
    "fastify": "^5.1.0"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 写 `apps/server/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "moduleResolution": "Bundler" },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: 写 `apps/server/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
```

- [ ] **Step 4: 写 `apps/server/.env.example`**

```
PORT=3000
NEW_API_BASE_URL=
NEW_API_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
```

- [ ] **Step 5: 写路由 `apps/server/src/routes/health.ts`**

```typescript
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));
}
```

- [ ] **Step 6: 写路由 `apps/server/src/routes/polish.ts`(M0 桩)**

```typescript
import type { FastifyInstance } from 'fastify';

export async function polishRoutes(app: FastifyInstance) {
  app.post('/polish', async (req, reply) => {
    const body = req.body as { rawText?: string };
    if (!body?.rawText) return reply.code(400).send({ error: 'rawText required' });
    // M0 桩:原样回传,M1 接 Claude
    return { polishedText: body.rawText };
  });
}
```

- [ ] **Step 7: 写路由 `apps/server/src/routes/storyboard.ts`(M0 桩)**

```typescript
import type { FastifyInstance } from 'fastify';

export async function storyboardRoutes(app: FastifyInstance) {
  app.post('/storyboard', async (req, reply) => {
    const body = req.body as { polishedText?: string };
    if (!body?.polishedText) return reply.code(400).send({ error: 'polishedText required' });
    // M0 桩:固定一镜,M1 接 Claude + prompt-kit 校验
    return {
      scenes: [
        { narration: body.polishedText, durationSec: 3, transition: 'fade', suggestedKeywords: [] },
      ],
    };
  });
}
```

- [ ] **Step 8: 写路由 `apps/server/src/routes/assets.ts`(M0 桩)**

```typescript
import type { FastifyInstance } from 'fastify';

export async function assetRoutes(app: FastifyInstance) {
  app.get('/assets/search', async (req, reply) => {
    const q = (req.query as { q?: string }).q;
    if (!q) return reply.code(400).send({ error: 'q required' });
    // M0 桩:空结果,M2 接 Pexels/Pixabay
    return { results: [] };
  });
}
```

- [ ] **Step 9: 写 `apps/server/src/app.ts`**

```typescript
import Fastify, { type FastifyInstance } from 'fastify';
import { healthRoutes } from './routes/health.js';
import { polishRoutes } from './routes/polish.js';
import { storyboardRoutes } from './routes/storyboard.js';
import { assetRoutes } from './routes/assets.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(healthRoutes);
  app.register(polishRoutes);
  app.register(storyboardRoutes);
  app.register(assetRoutes);
  return app;
}
```

- [ ] **Step 10: 写失败测试 `apps/server/src/app.test.ts`**

```typescript
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
```

- [ ] **Step 11: 跑测试确认失败**

Run: `pnpm --filter @v2video/server test`
Expected: FAIL，`app.js` 或依赖未找到

- [ ] **Step 12: 写 `apps/server/src/server.ts`**

```typescript
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const app = buildApp();
app.listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`server on :${port}`))
  .catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 13: 安装依赖并跑测试确认通过**

Run: `pnpm install && pnpm --filter @v2video/server test`
Expected: PASS，3 个测试全绿

- [ ] **Step 14: 提交**

```bash
git add apps/server
git commit -m "feat(server): stateless Fastify proxy skeleton with stubbed routes"
```

---

## Task 6: apps/mobile(Expo dev-client + expo-router 骨架)

**Files:**
- Create(经 create-expo-app 生成后修改): `apps/mobile/*`, 重点 `apps/mobile/metro.config.js`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/package.json`(改 name)

- [ ] **Step 1: 生成 Expo 应用(default 模板自带 expo-router)**

Run: `cd apps && npx create-expo-app@latest mobile --template default --no-install && cd ..`
Expected: 生成 `apps/mobile`,含 `app/` 目录(expo-router)

- [ ] **Step 2: 改 `apps/mobile/package.json` 的 name 与脚本**

把 `"name"` 改为 `"mobile"`,并确保 scripts 含:

```json
{
  "name": "mobile",
  "scripts": {
    "start": "expo start --dev-client",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: 写 monorepo 用 `apps/mobile/metro.config.js`**

pnpm + Metro 必须显式告诉 Metro 去仓库根找依赖,否则解析 workspace 包会失败。

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

- [ ] **Step 4: 覆盖 `apps/mobile/app/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 5: 覆盖 `apps/mobile/app/index.tsx`(骨架首页)**

```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>v2video</Text>
      <Text style={styles.subtitle}>Phase 1 骨架就绪</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0b0f' },
  title: { color: '#fff', fontSize: 32, fontWeight: '700' },
  subtitle: { color: '#9a9aa2', fontSize: 16, marginTop: 8 },
});
```

- [ ] **Step 6: 安装依赖**

Run: `pnpm install`
Expected: workspace 安装成功,`apps/mobile/node_modules` 就位

- [ ] **Step 7: 类型检查验证骨架可编译**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: 无类型错误(如有 expo-router 类型提示,按提示加 `expo-env.d.ts` 已由模板生成)

- [ ] **Step 8: 提交**

```bash
git add apps/mobile
git commit -m "feat(mobile): Expo dev-client + expo-router skeleton with monorepo metro"
```

> 注:`expo start` 需要真机/模拟器,本计划不在 CI 跑;骨架以 `tsc --noEmit` 通过为验收。运行 App 留到 M3 有可视内容时。

---

## Task 7: 顶层校验与收尾

**Files:**
- 无新增,验证根脚本

- [ ] **Step 1: 全量类型检查**

Run: `pnpm typecheck`
Expected: 所有包 + mobile 均通过

- [ ] **Step 2: 全量测试**

Run: `pnpm test`
Expected: render-core / prompt-kit / server 测试全绿,shared-types/mobile 无测试占位通过

- [ ] **Step 3: 全量构建(不含 mobile)**

Run: `pnpm build`
Expected: 各 TS 包生成 dist,无报错

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore: M0 scaffolding complete — typecheck/test/build green"
```

- [ ] **Step 5: 推 GitHub(Public,账号 7Yearsss)**

Run:
```bash
gh repo create v2video --public --source=. --remote=origin --push
```
Expected: 远端仓库创建,本地 master 推送成功,打印仓库 URL

---

## Self-Review

**Spec coverage(对照 spec 各节):**
- §3 架构(monorepo / 薄代理 / 三包)→ Task 1/2/3/4/5/6 ✔
- §3.1 render-core 脊椎(Project→RenderTimeline)→ Task 3 ✔
- §5 数据结构(Asset/Scene/Project/ProjectSettings)→ Task 2 ✔(字段与 spec 一致,含 transition 四值、voiceover:null)
- §7 技术栈(pnpm/TS/Vitest/Zod/Fastify/Expo/expo-router)→ 全覆盖 ✔
- §4 分层渲染:本里程碑只产出 timeline 类型(asset 层 + subtitle 层),真正分层播放器在 M3 计划 ✔(M0 不实现 UI 合成,符合"骨架"定位)
- 注:AI 真实调用、SQLite、素材搜索、预览播放器、录屏导出 = M1/M2/M3,不在本计划,符合 scope check 的子系统拆分。

**Placeholder scan:** 无 TBD/TODO;路由桩为有意为之的 M0 行为(已注明 M1/M2 接真实实现),非占位失败。

**Type consistency:** `compileProject`、`RenderTimeline`、`SceneClip`、`Layer`、`storyboardSchema`、`parseStoryboard`、`buildApp` 在定义与引用处命名一致;`transition` 四值(none/fade/slide/zoom)在 shared-types、render-core 测试、prompt-kit schema 三处一致。
