# v2video

AI 驱动的短视频创作 App。文本 → AI 润色 → AI 分镜 → 选/传素材 → 类剪辑预览 → 导出 MP4。

设计文档见 `docs/superpowers/specs/`,实现计划见 `docs/superpowers/plans/`。

## 包结构

- `packages/shared-types` — 前后端共用数据契约
- `packages/render-core` — Project → RenderTimeline(渲染脊椎)
- `packages/prompt-kit` — AI prompt 与输出校验
- `apps/server` — 无状态 Fastify 薄代理
- `apps/mobile` — Expo App

## 环境准备(只第一次)

```bash
corepack enable      # 激活 pnpm
pnpm install         # 安装所有依赖
```

## 本地测试

### 代码 + 后端(无需设备)

```bash
pnpm typecheck       # 全部包类型检查
pnpm test            # 全部单元测试
pnpm build           # 编译所有 TS 包

# 单独跑某个包
pnpm --filter @v2video/render-core test
pnpm --filter @v2video/prompt-kit test
pnpm --filter @v2video/server test
```

### 起后端调接口

```bash
pnpm --filter @v2video/server dev    # http://localhost:3000,改代码自动重启
```

打接口(⚠️ Git Bash 里中文用 `curl -d` 会报 Content-Length 错,用 PowerShell 或 ASCII):

```powershell
# PowerShell
curl http://localhost:3000/health
Invoke-RestMethod -Uri http://localhost:3000/storyboard -Method Post `
  -ContentType "application/json" -Body '{"polishedText":"熬夜会让你变丑"}'
```

> 当前 `/polish`、`/storyboard`、`/assets/search` 均为桩数据,M1/M2 接入真实 Claude 与素材库。

### 手机端(Expo)

```bash
pnpm --filter mobile start
```

Metro 启动后在终端按键:`w` 浏览器 / `a` Android 模拟器 / `i` iOS 模拟器(需 Mac)。

> ⚠️ 默认模板使用 `NativeTabs` 等原生模块,**Expo Go 无法加载**,需 development build。
> 且 M3 的 Skia + 录屏模块也必须 dev build。详见下方说明 / `docs/`。
