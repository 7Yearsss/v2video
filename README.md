# v2video

AI 驱动的短视频创作 App。文本 → AI 润色 → AI 分镜 → 选/传素材 → 类剪辑预览 → 导出 MP4。

设计文档见 `docs/superpowers/specs/`,实现计划见 `docs/superpowers/plans/`。

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
