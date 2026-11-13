# ThingVerse 场景 Blocks

Immortal UI 的交互预览使用「青禾试验站」的合成数据。设备标识在目录、群组、详情和告警里保持一致。北区二号剖面仪从设备详情进入土壤剖面或遥测查询，剖面中的历史入口会带上所选探针的指标。

| Block | 操作者的任务 | ThingVerse 源码依据 |
| --- | --- | --- |
| `fleet-overview` | 从大量设备中定位目标，用产品和状态缩小范围，再快速核对身份与活动时间。 | `web/apps/admin/src/sections/device/devices/view/device-view.tsx` 和 `device-list-columns.ts` 提供按关键词、产品、状态的查询，以及静态产品属性列。 |
| `device-detail` | 确认设备身份、连接和准入，核对最新遥测、静态属性和设备事件。 | `web/apps/admin/src/sections/device/devices/detail/view/device-detail-view.tsx`。连接和最近活动来自 Passport，采样时间与质量来自遥测。 |
| `telemetry-explorer` | 选择时间和指标，比较趋势，核对结果中的原始采样。 | `web/apps/main/src/components/devices/detail/historyData/` 和 `HistoryDataPanel.tsx`。ThingVerse 来源提供原始遥测，旧 POI 来源另外提供统计和导出。 |
| `device-groups` | 在层级中找到区域或业务群组，浏览其直接绑定的设备。 | `web/apps/admin/src/sections/device/group/group-table.tsx` 和 `group-device-bind-dialog.tsx`。群组有父子关系，设备关联按群组读取。 |
| `soil-profile` | 按物理深度对照读数，定位缺测探针，再查询对应层的历史。 | `web/apps/main/src/components/devices/detail/MoistureLatestDataThingverse.tsx` 和 `historyData/thingverseSource.ts`。深度来自测点定义的 `distribution`，各层观测来自遥测。 |
| `alert-console` | 按状态和级别处理告警，沿设备追查，区分确认、清除与现场恢复。 | `web/apps/admin/src/sections/rule-chain/view/rule-alarm-view.tsx` 及 `web/apps/admin/src/services/rule-chain/types.ts`。告警状态是 `ACTIVE`、`ACKNOWLEDGED` 和 `CLEARED`。 |

## 接入业务时

- 设备目录和群组样例接收调用方已获授权的数据。ThingVerse 设备目录可沿用服务端搜索与分页，把现有表格、快速预览和状态筛选的呈现方式接入。群组计数采用直接绑定，物理位置可由设备资料单独提供。
- 设备详情分别传入连接状态、最近活动、准入状态与观测数据。缺失的连接状态用 `null` 表示。原始标识、单位和采样来源从调用方数据传入。
- 遥测查询接收 UTC 毫秒时间范围，两端包含。应用决定可查询指标、允许的窗口和最大样本量。应用提供 `onExport` 时显示导出入口，导出参数取自已应用的查询。查询输入与结果使用同一 UTC 时间范围，保留采样时间精度。
- 土壤探针按安装深度等比例绘制。传入各深度的已对齐观测、采样时间和单位，读数缺失用 `null` 表示。选择探针只切换当前观测点及其历史入口。
- 告警确认和清除调用应用提供的动作，列表状态以回读为准。清除更新告警记录。现场条件依据设备的独立观测。

## 预览路径

- `#/blocks/fleet-overview` → 北区二号土壤剖面仪 → 土壤剖面 → 60 cm → 对应指标的历史查询。
- `#/blocks/device-groups` → 北区 02 样地 → 设备详情。切换南区可查看离线设备快照。
- `#/blocks/alert-console` → 严重告警 → 模拟确认失败后重试 → 清除 → 核对现场条件。
