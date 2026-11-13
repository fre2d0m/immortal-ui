# Icons 图标库补齐与验收

Icons 六个分类的 36 个占位已全部替换为可用图标：26 个使用项目现有 `lucide-react@1.57.0`，10 个为原创 SVG 扩展。图标页支持中文/英文/协议关键词搜索、来源筛选、16/20/24/32px 预览、详情、SVG 复制与下载、React 用法及扩展安装。

采用 [Lucide 官方设计规范](https://lucide.dev/contribute/icons/specification) 的 24 × 24 网格、2px 线宽、圆角端点和连接；颜色使用 currentColor。Lucide 图标使用静态具名导入，图标页按需加载，未引入整个动态图标包。[React 用法](https://lucide.dev/guide/react) 与 [许可证](https://lucide.dev/license) 可在官方文档核对。

## 图标映射

加粗项为自绘扩展，其余直接使用 Lucide。

| 分类 | 中文语义与组件名 |
| --- | --- |
| 感知与测量 | 温度 · Thermometer；湿度 · Droplets；压力 · Gauge；流量 · **FlowMeter**；光照 · Sun；空气质量 · **AirQuality** |
| 设备与执行 | 水泵 · **WaterPump**；阀门 · **Valve**；风机 · Fan；电机 · **ElectricMotor**；加热器 · Heater；照明 · Lightbulb |
| 连接与通信 | 网关 · Router；蜂窝网络 · RadioTower；低功耗广域网 · Radio；无线局域网 · Wifi；有线总线 · **FieldBus**；边缘节点 · Cpu |
| 空间与资产 | 场站 · Factory；区域 · Map；机柜 · Server；管路 · **Pipeline**；储罐 · **StorageTank**；设备箱 · **DeviceEnclosure** |
| 能源与资源 | 电能 · Zap；用水 · Droplet；燃气 · Flame；储能 · BatteryCharging；太阳能 · SolarPanel；热能 · **HeatEnergy** |
| 状态与事件 | 在线 · Link；离线 · Unlink；运行 · Activity；待机 · Power；故障 · OctagonAlert；检修 · Wrench |

## 自绘图标的语义

检查现有 Lucide 导出后，对没有贴切对应的领域图形补绘如下。LPWAN 使用已有 Radio 射频符号并保留协议文字，太阳能使用已有 SolarPanel；不把燃油加注机用于水泵，也不把数据库用于实体储罐。

| 图标 | 形态与用途 |
| --- | --- |
| 流量 / FlowMeter | 管道中的圆形表头表达流量计，区别于开放水面和一般压力仪表。 |
| 空气质量 / AirQuality | 气流与悬浮颗粒表达空气质量；具体污染物以 PM2.5、CO₂ 或 VOC 标签区分。 |
| 水泵 / WaterPump | 蜗壳、叶轮和出口构成水泵轮廓，避免把水泵画成燃油加注机。 |
| 阀门 / Valve | 管线上的对向阀体与阀杆，开度、开关和故障由旁边的状态表达。 |
| 电机 / ElectricMotor | 以机壳、散热筋、轴端和底座区分电机与通用齿轮设置。 |
| 有线总线 / FieldBus | 共用干线连接多个节点，区别于 USB 线缆，适合 RS-485、CAN 等现场总线。 |
| 管路 / Pipeline | 弯管与两端法兰表达管路资产，区别于液体、流量和通用连接线。 |
| 储罐 / StorageTank | 罐体与液面表达实体储罐，区别于表示数据库的堆叠圆柱。 |
| 设备箱 / DeviceEnclosure | 封闭箱体、门锁与出线口表达设备外壳或接线箱。 |
| 热能 / HeatEnergy | 三组上升热流和基线表示热量或供热，区别于具体的加热设备。 |

## 实现变更

| Before | After |
| --- | --- |
| 36 个虚线框占位 | `src/content/icons.ts` 提供六类完整语义映射、来源、搜索词和说明；`IoTIcon.tsx` 显式导入并渲染 26 个 Lucide 与 10 个扩展。 |
| Icons 标注“规划中” | 导航显示总数、分类数量和来源统计。 |
| 仅分类浏览 | 增加关键词搜索、来源筛选、组合筛选、空结果恢复与四档实际尺寸预览。 |
| 图标不能直接复用 | 点击打开可键盘操作的详情，提供 SVG 复制/下载、React 代码复制；关闭后焦点返回原图标。 |
| 缺少领域 SVG 源码 | `registry/immortal/icons/iot-icons.ts` 提供 10 个独立具名组件，兼容 Lucide 属性；`iot-icons` 注册包安装到消费者的 `components/icons`。 |
| 没有下载资产流程 | `scripts/build-icons.mjs` 从同一组件源生成 36 份 SVG、目录元数据和许可证；registry 构建同时生成，Lucide SVG 保留完整上游许可说明。 |
| 固定占位网格 | 目录沿用面板材质；窄屏切换两列图标，详情独立滚动；选中态不改变字重，输入与操作按钮复用现有样式。 |
| 安装文档检查只认识 Components/Blocks | 目录契约同时检查 Icons 的安装入口和导入路径；README 更新实际完成范围，registry 共 31 项。 |
| 产物与预览未包含图标资产 | 生产镜像包含 Icons 页面、SVG 下载、许可证与 `iot-icons.json`。 |

## 验收

- `npm run check` 成功：类型检查、31 项测试和生产构建通过。完整记录：[构建日志](../outputs/icons-20261104/final-check.log)。
- 36 份 SVG 均通过 XML 解析，检查 viewBox、currentColor、2px 线宽、圆角、非空图形、可访问名称及 Lucide 许可证。
- 真实浏览器确认 36 个图标全部渲染；Lucide 筛选为 26 个，SVG 扩展为 10 个；“RS-485”定位有线总线；空间分类与 SVG 来源组合为 3 个；无匹配搜索可恢复。
- 图标实际宽度按 16/24/32px 检查，详情同时展示 16/20/24/32px。SVG 复制含图形与来源，React 复制含正确导入路径。
- 浏览器实际下载的 `temperature.svg` 与生成文件逐字节一致。Escape 关闭详情后，焦点返回原来的图标按钮。
- 浅深色与 320px 窄屏已实测；窄屏页面宽度 320px，无横向溢出；详情宽度 288px、高度最多 768px，可内部滚动。最终浏览器无 error/warn。
- 官方 shadcn CLI 在独立临时项目成功安装 `iot-icons`。该项目引用全部 10 个扩展后，类型检查与构建通过：[安装记录](../outputs/icons-20261104/consumer-install.log)、[构建记录](../outputs/icons-20261104/consumer-build.log)。
- 本地生产镜像与开发安装入口已更新；没有发布远端版本。

[浏览器原始检查](../outputs/icons-20261104/browser-checks.json) · [深色全目录](../outputs/icons-20261104/icons-dark.jpg) · [浅色全目录](../outputs/icons-20261104/icons-light.jpg) · [窄屏目录](../outputs/icons-20261104/icons-mobile.jpg) · [手机详情](../outputs/icons-20261104/pump-mobile-detail.jpg)
