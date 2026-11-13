这些是验收宿主，不是安装依赖。audit-check.html 放在隔离预览根目录，audit-check.tsx 放在该预览的 src/；同时复制项目 src/、registry/、public/ 及配置，预览端口 4195。branchLine 提供两个对齐端点的固定输入，用于验证横向路径标注。consumer-main.tsx 用于通过注册表 CLI 安装 Graphite 与 data-workflow 的独立宿主（端口 4196），演示数据由宿主单独提供。组件实现未从展示层导入。
临时服务已停止；保留仓库原有的 4177 预览。
