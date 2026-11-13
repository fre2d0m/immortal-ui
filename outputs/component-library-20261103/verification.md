# 组件分类与业务场景验收

日期：2026-11-03

本地预览：

- Components：<http://127.0.0.1:4177/#/components>
- Blocks：<http://127.0.0.1:4177/#/blocks>
- 温室示例：<http://127.0.0.1:4177/#/blocks/greenhouse-control>

## 实现结果

- 17 个独立组件：传感器 5 个、数据可视化 3 个、控制及反馈 6 个、事件及告警 3 个。
- 4 个可运行 Block：温室控制、设备巡检、参数配置、告警处置。
- 3 个场景占位：分区灌溉、冷链环境、能源管理；均有独立页面、结构说明和基础组件链接，无安装命令。
- Registry 共 23 个可安装条目（17 个组件、4 个 Block、1 个主题、1 个工具库）。
- Components 与 Blocks 各有独立分组侧栏，支持分组页面、搜索、空结果、详情面包屑、手机导航。

## 构建与契约检查

- `npm run lint`：通过。
- `npm test`：21/21 通过，包含目录分组、可安装条目对应、规划场景边界、组合链接、依赖闭包、内嵌源码和既有主题/遥测检查。
- `npm run build`：通过，新增预览按需加载；主入口约 473 kB，无大包警告。
- `git diff --check`：通过。
- `docs/` 与最终生产 `dist/` 镜像一致。
- 生产镜像使用 `https://immortal.build/r/`；本地 `public/r/` 已重新生成，使用 `http://127.0.0.1:4177/r/`，便于本地安装预览。

## 浏览器检查

使用真实浏览器操作与页面状态验证，演示交互不调用设备或云端服务。

- 桌面 1440px：17 个组件详情逐页加载，均有独立预览，无横向溢出、NaN 或 Infinity。
- 320px：2 个目录页、17 个组件详情和 7 个场景详情，共 26 页；页面与预览卡片均无横向溢出或裁切（浏览器滚动条占位后可用宽度 305px）。
- 深色与浅色目录检查通过。手机导航可以打开、进入 Components、选择组件并自动关闭。
- 中文搜索“告警”返回 Alert card；无匹配词显示空状态，清除后恢复全部组件。
- Setpoint control：越界 60 不允许提交；26.5 成功后更新回读；27 请求失败时仍显示回读 26.5，重试后成功；离线禁用。
- Directional control：开启确认后，关闭方向不可点击，停止可用；停止确认后允许关闭。
- Control mode：原生单选键盘右方向键从手动切换到自动；320px 下标签保持完整，按钮高度 56px。
- Greenhouse control：自动模式锁定泵，手动模式可以启泵；断网后模式与控制不可用，三个传感器显示缺失读数和 12 分钟数据年龄。
- Range gauge：目标区间正确显示；键盘 Home 设置为 0，仍显示真实零值；无数据模式显示破折号。
- Automation note：失败不改变采纳状态，重试可采纳；重置后可忽略。
- Alert card：确认失败保留告警，重试后标为已确认，文案区分确认与恢复。
- 原有 Alert console：失败、重试、待确认清空、All 筛选均通过，确认后显示 3 条已确认告警。
- 最终浏览器控制台无错误。

页面测量原始记录：[browser-audit.json](browser-audit.json)。

## 截图

- [Components / 浅色](components-desktop.jpg)
- [Components / 深色](components-dark.jpg)
- [Blocks / 场景目录](blocks-desktop.jpg)
- [Control mode / 手机](control-mode-mobile.jpg)

## 范围

此次验收覆盖本地页面、交互与 registry 构建契约。没有连接真实设备或控制服务，没有执行新的外部 consumer 安装，没有提交、推送或部署。工作分支为 `codex/component-taxonomy-blocks`。
