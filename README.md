# 阿基的动态镜头库 · NJX

三个可复用的 Remotion 动效组件，与使用同一套组件的交互预览网页。

**[在线预览](https://linjixu173-wq.github.io/motion-library-njx/)** · **[GitHub 源码](https://github.com/linjixu173-wq/motion-library-njx)**

这些效果依据参考录屏观察重建，不是从 MP4 中恢复出的原始剪辑工程。所有运动由当前帧计算，可以回退、拖动时间线与离线渲染。示例图片用于展示效果，实际创作可替换为自己的素材。

| 动效 | 组件 | 演示规格 | 可以调什么 |
| --- | --- | --- | --- |
| 大头特效 | `BigHeadPop` | 4 秒 / 900 × 1200 | 头部中心、影响范围、放大、抖动、放射线 |
| 回忆频闪 | `MemoryFlash` | 6 秒 / 1920 × 1080 | 换图间隔、旋转、推拉、蒙版、边缘柔化 |
| 图片堆叠 | `PhotoStack` | 5 秒 / 1920 × 1080 | 入场间隔、卡片大小、角度、层叠、圆角、边框 |

## 本地运行

安装 Node.js 22 或更高版本，在本文件夹运行：

```sh
npm ci
npm run dev
```

浏览器打开 `http://localhost:4174`。在线页面支持更换本地图片（不上传）、调整参数和下载参数 JSON。替换本地图片后，请将图片放进项目 `public`，在组件参数中使用相对路径；临时 `blob:` 地址不能作为永久素材路径。

```sh
npm run studio       # Remotion Studio，带参数面板
npm run typecheck    # TypeScript 检查
npm run build        # 生成 docs 静态网页
npm run render:stack # 导出图片堆叠 MP4
npm run render:memory
npm run render:head
```

网页预览不在服务器生成 MP4；视频在本地 Remotion 导出。首次渲染可能需要 Remotion 下载浏览器。Remotion 的使用遵循其[官方许可](https://www.remotion.dev/license)。

## 放进你的 Remotion 视频

复制 `effects/` 与 `public/motion-library/` 到项目。导入组件和默认参数：

```tsx
import {Sequence} from 'remotion';
import {MemoryFlash, memoryFlashDefaults} from './effects';

<Sequence from={26 * 30} durationInFrames={9 * 30}>
  <MemoryFlash
    {...memoryFlashDefaults}
    foreground="motion-library/assets/portrait.jpg"
    backgrounds={[
      'motion-library/assets/crown12.jpg',
      'motion-library/assets/crown16.jpg',
    ]}
  />
</Sequence>
```

参数表与类型定义都在各组件开头的 Zod schema 中，默认参数紧随其后。完整注册示例见 `effects/LibraryCompositions.tsx`。

### 大头特效

在原画面上进行局部连续 WebGL 变形，不切出独立人像。`centerX/centerY` 为画面中的归一化头部中心，`radiusX/radiusY` 为影响区域半径；换照片需要重新校准。`mediaType: 'video'` 可加载视频，`headTrack` 可手动填写头部中心的关键帧（时间严格递增，不支持自动跟踪）：

```tsx
headTrack: [
  {seconds: 0, x: 0.53, y: 0.20},
  {seconds: 2, x: 0.58, y: 0.25},
]
```

### 回忆频闪

前景默认使用完整原图与椭圆渐变蒙版；背景数组支持图片和视频。`mask` 可选 `oval`、`soft-rectangle`、`none`，`feather` 控制边缘。`foregroundCenterX` 用于对齐原图中的人物中心。

### 图片堆叠

`images` 支持 1–12 张图片。新卡片入场时，之前的卡片缩小、上移并错开。增加图片数量或入场间隔后，请对应延长 Composition 的 `durationInFrames`，确保最后一张有时间停留。

## 目录

- `effects/`：三个独立组件、共享素材组件、默认参数与 Studio 注册。
- `web/`：中文交互预览页面。
- `public/motion-library/assets/`：示例图片。
- `scripts/build.cjs`：打包网页，静态资源使用相对地址，支持 GitHub Pages 子目录。
- `remotion.tsx`：Remotion Studio 入口。

下载包不含参考录屏、电脑本地路径、缓存和其他视频项目。网页引用的源码来自这些同名组件，而非另做一套视觉模拟。


## GitHub 仓库结构与发布

本项目的源码与可视化预览共用独立仓库 `motion-library-njx`。根目录为源码，`docs/` 为已构建的预览网页，`docs/downloads/` 为完整源码下载包。

更新后执行 `npm run build` 与 `npm run package`，提交源码和 `docs/`。GitHub Pages 使用 `main` 分支的 `/docs` 目录发布。
