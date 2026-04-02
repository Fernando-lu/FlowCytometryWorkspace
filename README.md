# FlowCytometryWorkspace

## 项目介绍
FlowCytometryWorkspace 前端工程，基于 Vue 3 + Vite 开发。

## 使用方法

```sh
pnpm install
pnpm dev
```

打开终端里 `vite` 输出的地址即可。

## 交互标注

下方画布支持手动标注（按钮在页面上方）：

1. `crosshair`：点击散点区域，画十字虚线（松手后会自动回到 `undefined`）。
2. `rect`：按住鼠标在起点拖拽矩形，松开后生成矩形区域边框（自动回到 `undefined`）。
3. `polygon`：连续点击顶点；点击起始点附近完成后生成多边形，生成后需要先点 `clear` 才能重新画。
4. `undefined`：关闭绘制模式。
5. `clear`：清除当前手动画（并取消临时绘制状态）。

上方画布为 AI 分割结果：绿色多边形控制点可拖动微调形状。

## 使用了哪些库

运行依赖：
- vue
- vue-router
- pinia
- pixi.js
- uuid

开发依赖：
- vite
- vue-tsc
- @vitejs/plugin-vue
- @vitejs/plugin-vue-jsx
- eslint
- oxlint / oxfmt
