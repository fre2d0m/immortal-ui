# 基础控件状态与工作流选择器验收

日期：2026-11-13。范围：共享 Graphite 主题、工作流节点选择器及受影响安装产物。保留工作区其他未提交改动；没有提交或部署。

## 问题与修正

1. 未选中 Tab 的悬停原本叠加渐变与内描边，与选中滑块竞争视觉权重。按下新 Tab 时，触发项自身的选中按压规则还会在移动滑块之外绘制第二块表面。现在未选中悬停只轻调文字，选中状态仅由一个滑块或下划线表达；滑块移动及按住期间，触发项自身保持透明。无移动指示器的上游 Tabs 保留静态选中反馈。
2. 选择器达到 480px 最大高度时，原独立 Tabs 外层被压缩到 24.78px，内部 Tab 栏仍高 42px；下一块分类标题从栏底以上约 5.22px 开始，产生遮挡。现在 Tab 栏与对应 TabsContent 位于同一容器，标题、搜索与 Tab 栏保留自然高度，只有结果区域收缩滚动。Tab 栏与结果区间距 12px，结果内另有 4px 内边距。
3. 导航、筛选、单选分段的未选中悬停/按下改为平面浅底，选中项保留持续状态。普通动作按钮、菜单、开关和输入控件继续使用各自的反馈，不把相同材质配方当作相同交互语义。

修改位置：`registry/immortal/styles/graphite.css`、`registry/immortal/blocks/workflow-parts.tsx`、`registry/immortal/blocks/data-workflow.css`。基础规范与工作流说明同步补充了状态区分和滚动边界；已有安装主题契约测试按控件职责调整。

## 实际浏览器检查

Chrome，独立冻结预览，未与构建过程共用会自动刷新的服务。

- 深浅主题：默认、下划线、纵向、纵向下划线、手动激活、禁用项及无移动滑块的上游 Tabs。
- 保持一个已选中项，同时悬停另一项；按住鼠标并逐帧采集滑块过渡，确认不存在第二块渐变/投影表面，每帧仅一个 aria-selected=true。
- 键盘方向键切换、跳过禁用项、手动激活、清晰焦点；减少动效与强制颜色模式。
- 导航、筛选、单选分段的悬停与选中区分；复选框和开关悬停不改变值、点击改变值；滑块悬停不改变数值、键盘输入改变数值；输入框和菜单勾选状态核查。
- 固定输入的 50 个新增候选、30 个已有候选：标题/搜索/Tab 栏不随结果滚动；切换对应内容区、搜索、无匹配、清空搜索、End/Enter 到末项、Escape 返回入口。
- 320×480、320×900、390×640，以及 20px 主字号、长上下文、深浅主题。核对弹层边界、内部水平溢出、左右内边距、Tab 栏与分类标题间距，并实际查看截图。
- Chrome 触控模拟：Tab 点击目标至少 40px，切换与选择已有节点可用。
- 实际工作流演示“合并多源观测 / 失败”端点：连接已有失败归档后，宿主定义出现 join → failure 的 error 边；新增失败节点后，增加一个节点和对应边。两种操作均核对保存后的定义。

最终 `checks.json` 及 `installed-checks.json` 的页面错误、控制台错误、HTTP 错误记录均为空。预览服务日志保留了验证环境首次启动时的临时目录访问限制记录；修正实际路径白名单后重跑通过，本次最终运行未出现 ResizeObserver 循环警告。早期脚本与夹具调试记录在 `intermediate/`，不能作为最终截图。

## 安装、导出与工程检查

- 全新临时消费项目通过 shadcn CLI 安装 `graphite` 与 `data-workflow`，使用生成的主题 CSS；四个 Block 文件及共享 Tabs 与源文件一致。
- 独立安装页面实际检查深浅主题：未选中悬停透明、仅一个选中项、结果区域保持间距；选择已有失败节点正确调用宿主 onChange。
- 独立消费项目类型检查与生产构建通过。
- 从实际主题页面下载 CSS，文件完整包含当前 Graphite 源样式及主题参数；见 `export-and-narrow.json` 与 `exported-theme.css`。
- `npm run check` 通过：类型检查、80 项测试、生产构建。构建保留现有大体积 chunk 提示，不属于此次状态/布局修复。
- registry、公开主题 CSS 与静态站点生成产物同步；`docs/` 与 `dist/` 一致，更新前的 docs 副本保留于 `/tmp/immortal-foundation-states/docs-before-sync`。
- `git diff --check` 通过。

## 证据

| 内容 | 文件 |
| --- | --- |
| 原问题截图与高度数据 | `before.png`、`before.json` |
| 实际工作流修复后 | `workflow-picker-dark.png`、`workflow-narrow-dark.png`、`workflow-narrow-light.png` |
| 独立安装深浅主题 | `installed-picker-dark.png`、`installed-picker-light.png` |
| 大字号、矮视口长列表 | `long-picker-dark-320-20.png`、`long-picker-light-320-20.png` |
| 基础控件与强制颜色 | `foundation-dark.png`、`foundation-light.png`、`forced-colors.png` |
| 浏览器断言及测量 | `check.mjs`、`checks.json`、`installed-check.mjs`、`installed-checks.json` |
| 临时验证页面来源 | `fixtures/` |
| 工程、安装与构建日志 | `check.txt`、`consumer-install.txt`、`consumer-typecheck.txt`、`consumer-build.txt` |

证据范围为本地 UI、交互、流程定义和安装/导出边界；不是真实设备接入、后端执行或整个基础组件库的全面无障碍认证。触控是浏览器模拟，未测试实体触屏或屏幕阅读器。
