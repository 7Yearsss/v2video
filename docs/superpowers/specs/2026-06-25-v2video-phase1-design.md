# v2video — Phase 1 设计文档

> 日期:2026-06-25
> 状态:已确认架构决策,待评审
> 一句话:一个 AI 驱动的短视频创作手机 App。用户上传文本 → AI 润色 → AI 规划分镜 → 选/传素材 → 类剪辑预览 → 导出 MP4(静音)。

---

## 1. 范围(Phase 1 only)

本期交付:

- 文本上传 + AI 润色
- AI 分镜规划(每分镜:文案 / 时长 / 素材建议关键词 / 推荐素材)
- 全局素材库 + 项目素材库(用户可预先放置)
- 分镜从全局/项目素材池选,或临时上传(**每分镜单素材**)
- 类剪辑预览:点击分镜 → 自动连续播放(文案 + 素材 + 字幕 + 转场)
- 字幕由文案自动生成
- 单分镜"不满意重新生成"(重新 roll 文案/时长/素材建议)
- 项目设定:画幅比例、字幕字体/颜色/描边/位置(配音字段保留,UI 置灰)
- 导出 MP4(**静音**,经手机录屏)

**明确不在本期**(留作后续阶段):配音/TTS、Lottie 及复杂动效、hyperframes、爆款分析模板、用户登录、付费、云端同步。

---

## 2. 四个锁定的架构决策

| 决策 | 结果 | 理由 / 影响 |
|---|---|---|
| 视频导出 | **录屏优先,render-core 接口抽象** | 零服务端成本快速验证;渲染逻辑抽象成可替换黑盒,Phase 3 切服务端 FFmpeg 时业务代码不改 |
| 平台 | **iOS + Android 跨平台** | 录屏(ReplayKit / MediaProjection)隔离成独立原生模块,两套实现一个接口 |
| 数据 | **本地优先** | 项目/分镜/素材元数据存设备 SQLite;后端只是无状态薄代理;无库、无账号、无对象存储 |
| 动效 | **仅字幕 + 转场** | 不引 Lottie;Skia/Reanimated 一套搞定;Lottie / hyperframes 进 Phase 2 |

---

## 3. 系统架构

```
apps/mobile (Expo + dev-client, RN + TS)
├── 内容引擎 UI(文本输入 → 润色 → 分镜列表)
├── 素材库 UI(全局 / 项目两个池子)
├── 类剪辑预览(分层播放器)
├── 录屏导出(全屏纯净渲染页 + 原生录屏模块)
└── 本地 SQLite(项目 / 分镜 / 素材元数据)

apps/server (Fastify + TS,无状态薄代理)
├── POST /polish          → 转发 Claude(经 new-api),返回润色文本
├── POST /storyboard      → 转发 Claude,返回分镜 JSON(经 schema 校验)
└── GET  /assets/search   → 转发 Pexels / Pixabay,统一成 Asset 结构
（藏 API key,不持久化任何数据）

packages/
├── shared-types   纯 TS 数据契约(前后端共用)
├── render-core    纯 TS:Scene[] → RenderTimeline(声明式 JSON,无 RN 依赖)⭐脊椎
└── prompt-kit     润色 / 分镜 prompt 模板 + 输出 schema 校验

Monorepo:pnpm workspace
```

### 3.1 脊椎:render-core

`render-core` 把一个项目编译成声明式 `RenderTimeline`——描述每个分镜的图层(素材层 / 字幕层)和时间轴的纯 JSON。

- **预览播放器** 消费 timeline → 实时播
- **录屏导出** 消费同一段 timeline → 全屏播完并录屏
- **(Phase 3)服务端 FFmpeg** 消费同一段 timeline → 服务端合成

这是"切换导出方式时业务代码不改"的兑现点。render-core 不依赖任何 RN API,可单独单测。

---

## 4. 关键技术决策:分层原生视图(对原构想的修正)

早期构想是"三层都画在同一个 Skia Canvas"。但**把 expo-video 的帧喂进 Skia canvas 在 RN 里是真正的硬骨头**。

由于 Phase 1 只有字幕 + 转场,**不需要**把视频塞进 Skia。改用分层原生视图:

```
┌──────────────────────────────────────┐
│ 层2:字幕 + 转场(Skia / Reanimated 透明覆盖层)│ ← 叠在上面
├──────────────────────────────────────┤
│ 层1:素材铺底(expo-video / expo-image 原生视图)│ ← 底层
└──────────────────────────────────────┘
        录屏抓取整个合成结果,不要求是单一 canvas
```

绕开最难的视频-入-Skia 问题,录屏照样捕获合成画面。Phase 2 上复杂 Skia 动效时再处理图层融合。

---

## 5. 数据结构(Phase 1 精简)

```typescript
// packages/shared-types/src/project.ts

interface Asset {
  id: string;
  scope: 'global' | 'project';      // 一个字段区分两个素材池
  projectId?: string;               // scope=project 时有值
  type: 'image' | 'video';
  source: 'pexels' | 'pixabay' | 'upload';
  url: string;
  thumbnailUrl: string;
  durationSec?: number;             // 视频素材才有
  width: number;
  height: number;
  tags: string[];
  createdAt: string;
}

interface Scene {
  id: string;
  projectId: string;
  order: number;
  narration: string;                // 文案 = 字幕来源
  durationSec: number;              // AI 估算,用户可调
  assetId: string | null;           // 单素材绑定,null=待选
  transition: 'none' | 'fade' | 'slide' | 'zoom';  // Phase1 仅这些
  suggestedKeywords: string[];      // AI 给的素材搜索词
  suggestedAssetIds: string[];      // 从已有池子推荐
  // motion?: ...                   // Phase2 占位,本期不实现
}

interface Project {
  id: string;
  title: string;
  rawText: string;                  // 用户原始输入
  polishedText: string;             // AI 润色后
  scenes: Scene[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

interface ProjectSettings {
  aspectRatio: '9:16' | '16:9' | '1:1';
  subtitle: {
    fontFamily: string;
    fontSize: number;
    color: string;
    strokeColor: string;            // 描边,短视频字幕标配
    position: 'bottom' | 'center';
  };
  voiceover: null;                  // 字段保留,UI 置灰,Phase2 填
}
```

---

## 6. 里程碑(本地优先版,内部切分)

每个里程碑独立可验证。

### M1 内容引擎(先做)
text → AI 润色 → 分镜 JSON。薄代理 + prompt-kit + schema 校验。UI 极简(调试页看输出)。
**目的:最快验证"AI 分镜质量"——这是产品命根子。质量不行,后面再炫的剪辑器都白搭。**

### M2 素材系统
全局/项目库 CRUD、stock 搜索(Pexels/Pixabay 代理)、临时上传(expo-image-picker)、分镜绑素材。落 SQLite。

### M3 预览 + 导出(最硬,约占一半工时)
render-core timeline → Skia/Reanimated 分层播放器 → 多分镜连续播放 → 字幕样式设定 → 全屏纯净渲染页 + 原生录屏导出 MP4(静音)。

---

## 7. 技术栈(Phase 1 收敛版)

**前端(Expo RN + TS)**
- 导航:Expo Router
- 状态:Zustand
- 请求:TanStack Query
- 渲染/动画:@shopify/react-native-skia + react-native-reanimated(预览+导出共用)
- 视频素材:expo-video;图片:expo-image
- 录屏导出:跨平台录屏库(ReplayKit / MediaProjection 封装)+ expo-file-system
- 上传:expo-image-picker
- 本地存储:expo-sqlite

**后端(Fastify + TS,无状态)**
- AI:Claude 经 new-api(润色 + 分镜)
- 素材代理:Pexels / Pixabay
- 无数据库、无对象存储、无缓存

**工程**
- Monorepo:pnpm workspace(apps/mobile、apps/server、packages/{shared-types, render-core, prompt-kit})
- 因 Skia + 原生录屏模块,需 Expo dev-client(非纯托管)

---

## 8. 主要风险

| 风险 | 缓解 |
|---|---|
| 录屏帧率不稳 → 复杂转场被录进卡顿 | Phase 1 转场刻意做轻;render-core 抽象保证 Phase 3 可切服务端渲染 |
| iOS/Android 录屏 API 差异大 | 隔离成独立原生模块,一个接口两套实现 |
| AI 分镜质量不达标(最大产品风险) | M1 先行,最小成本先验证;prompt-kit + schema 校验保证输出可用 |
| 录屏会录进系统 UI | 导出走专门的全屏纯净渲染页,隐藏所有 App UI |

---

## 9. 后续阶段(路线图,本期只设计"朝向它")

- **Phase 2**:TTS 配音(时间轴按真实语音时长重对齐)、Lottie + hyperframes 复杂动效、字幕逐字高亮、高质量导出走服务端(录屏降级为草稿预览)
- **Phase 3**:爆款分析——用户上传爆款文案,LLM 逆向出钩子结构/节奏/分镜模板存模板库供套用(差异化护城河)
- **Phase 4**:账号(手机号 + Apple/Google)、付费(国内微信支付宝 / 出海苹果内购)、配额(new-api token 计费限流)
