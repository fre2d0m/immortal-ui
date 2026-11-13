# 工作流缩放与端点细节

| Before | After |
| --- | --- |
| 缩放工具栏没有比例读数 | 缩小、实时百分比、放大、完整流程；百分比来自实际视口，等宽数字与图标居中，不额外占用键盘停靠点 |
| 连线与空闲输出的加号可见圆 24px、图标 14px | 可见圆 12px、图标 7px；缩小图形后保持描边清晰，40px 点击区域和轻微悬停放大保留 |
| 9px 实心/空心连接端点为平面单色 | 大小及实心/空心语义不变；采用克制渐变与内阴影，强制配色下以系统实心/空心轮廓表示 |

修改位于可安装 `data-workflow.tsx` / `data-workflow.css`；相同组件用于展示页，当前视觉约定同步到 `design-notes/data-workflow.md` 和 `design-notes/foundation-consistency.md`。

- `checks.json`：Chrome 深浅主题测量确认 12px/7px/40px 与两类9px端点；实际点击可见小圆外的保留区域仍可打开选择器，键盘插入与撤销通过。比例在 100%→120%→100%、适配全图、15%/180%边界及 Ctrl+滚轮缩放中与视口一致；普通动效中间帧同步变化。文字垂直中心与按钮图标偏差不超过1px，宽度不跳动。
- 同一检查覆盖320px宽度/20px字号、空画布、只读、减少动效、强制配色和触控模拟；无横向溢出。强制配色的实心背景等于空心边缘，空心内部与实心背景不同。
- `installed-and-live.json`：通过注册表更新的独立宿主和原有4177展示页均实测比例、加号尺寸与插入选择器；工具栏方向键跳过比例文字，在三个操作间导航。
- `install-final.log`、`install-equality.json`、`consumer-build.log`：两个安装文件与源码逐字一致；独立宿主类型检查和构建通过。
- `project-check.log`：源码类型检查、82项测试和生产构建通过。构建保留原有的大分块提示。本次未修改业务数据、节点规划与执行器，沿用上一轮分支/运行数据验证。
- 截图：`ports-dark.png` / `ports-light.png`、`zoom-dark.png` / `zoom-light.png`、`narrow-dark.png` / `narrow-light.png`、`live-canvas.png`。

证据限Chrome和触控/强制配色模拟，不代表真实触屏、其他浏览器、读屏软件或实际IoT链路验收。画布内9px/12px/40px按100%缩放计算，随画布一起缩放。
