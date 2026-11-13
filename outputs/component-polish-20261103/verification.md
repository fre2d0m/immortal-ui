# 视觉调整验收 · 2026-11-03

本轮对本地 Components / Blocks 设计补充做视觉修订。以下为当前页面的检查结果；没有提交或发布到线上。

- 目录底板使用平面背景和明确边框，不再与卡片阴影叠加。Graphite 的卡片阴影缩短，浅色与深色使用同一套层次规则；安装包与 Theme Studio 共享这些默认值。
- 移除页面标题上方的宽字距引导文字，以及目录链接、面包屑、命令回执和方向控制中的装饰箭头。
- 导航新增 Icons。页面包含六类、36 个带名称的图标位置，明确标注“规划中”和“图标尚未绘制”；类别筛选与移动端导航均可用。
- 页面隐藏常驻滚动槽，保留滚轮与键盘滚动；侧栏滚动条在悬停或键盘焦点进入时显示为细条，其余滚动容器使用透明轨道。
- 量程仪表演示改用统一 Slider，并补齐单滑块的可访问名称。实际使用 Home 键将读数调整为 0；切换无数据状态后滑块禁用。

## 实页验证

浏览器打开 `http://127.0.0.1:4177/`，使用实际页面而非静态复刻。

- 1440 × 1000：检查 Components 浅色/深色、Icons、Blocks 深色。卡片底板计算样式 `box-shadow: none`，页面 `scrollbar-width: none`，侧栏 `scrollbar-width: thin`。
- 320 × 800：检查 Components、Icons、Blocks，以及移动端导航。Icons 和 Blocks 的页面宽度与内容宽度均为 320，没有内容横向溢出；图标分类为六组、占位共 36 个。
- 侧栏实际滚动到 `scrollTop: 350`，主体仍保持原位；Blocks 主体实际滚动到 `scrollTop: 800`，页面无常驻滚动槽。
- Icons 的连接与通信、状态与事件分类切换可用。
- 浏览器未捕获到错误或警告。截图在导航关闭动画结束后保存，没有裁去滚动条区域。

## 自动检查

`npm run check` 通过：TypeScript、21 项既有回归检查、生产构建。`git diff --check` 通过。生产文件已同步至 `docs/`，本地安装地址已恢复为本地预览地址。

## 当前截图

- `components-light.jpg`
- `components-dark.jpg`
- `icons-desktop.jpg`
- `icons-mobile.jpg`
- `blocks-dark.jpg`

这些截图用于本轮验收。上一轮 `component-library-20261103/` 保留为历史记录。
