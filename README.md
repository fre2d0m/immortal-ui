# Dark Tactile UI (`tactile/ui`)

一套融合 **经典暗色轻拟物（Classic Dark Light-Skeuomorphism）** 与 **WebGL GLSL 物理流光金属（Physical Metallic Shaders）** 的交互组件库与 `shadcn/ui` 风格展示系统。

---

## ✨ 核心特性 (Features)

1. **双渲染引擎无缝切换（Dual Rendering Architecture）**
   - **默认风格 · 经典暗色轻拟物 (`classic`)**：基于纯 CSS `padding-box, border-box` 的 `135°` 对角双高光微倒角（左上 `rgba(255,255,255,0.45)` 主高光 + 右下 `rgba(255,255,255,0.24)` 次反光），搭配完全不透明的曜石黑凸起/凹陷表面，彻底杜绝半透明灰雾叠加。
   - **可选材质 · 6 大 WebGL 物理金属 (`gold` / `platinum` / `obsidian` / `cobalt` / `rosegold` / `emerald`)**：采用单实例共享 WebGL 上下文（Singleton WebGL Context）实时渲染 **24K 皇家黄金、镜面铂银、曜石黑钛、深海钴蓝钛、大马士革玫瑰金、极光祖母绿钛**，突破浏览器 16 个 WebGL Context 的限制。

2. **克制干净的光影交互（Restrained & Configurable Specular Optics）**
   - 默认保持静态 `135°` 对角双高光，鼠标滑入（Hover）或聚焦时**原地提亮金属光泽**，避免全屏旋转带来的视觉杂乱。
   - 支持利用 CSS Houdini `@property --local-rim-angle` 或 WebGL uniform 为特定按钮独立配置 `sweepDeg`（如 `+90°`、`+180°`、`+360°`），按需开启丝滑流光旋转。

3. **Web Audio 物理微动音效合成（Synthesized Haptic Audio）**
   - 内置零外部音频依赖的 `TactileAudioEngine`，基于 Web Audio API 实时合成清脆按钮微动、金属按压、拨杆开关与下拉选择音效。

4. **`shadcn/ui` 风格 Landing Page 与实战场景墙**
   - **Examples · Cards**：8 张高频业务卡片（OAuth 开发者登录、三宫格支付方式绑定、团队角色权限、链接分享、通知偏好、隐私与光学开关、工单提交、算力配额调节）。
   - **Dashboard**：4 张 KPI 核心指标卡 + 12 个月算力吞吐柱状图 + 近期节点调用结算列表。
   - **Playground**：AI 提示词工作台，包含多行文本域、模型选择器与多维参数滑块。
   - **Code & Docs**：支持一键复制 React (TSX) 与原生 HTML/CSS 源码。

---

## 🧩 组件清单 (Components)

| 组件名称 | 说明 | 支持属性 / 变体 |
| :--- | :--- | :--- |
| `TactileButton` | 轻拟物/流光金属按钮 | `variant`: `'default' \| 'metallic' \| 'recessed' \| 'danger' \| 'ghost'`<br>`size`: `'sm' \| 'md' \| 'lg' \| 'icon'`<br>`material`: `'classic' \| 'gold' \| 'platinum' \| 'obsidian' \| 'cobalt' \| 'rosegold' \| 'emerald'`<br>`sweepDeg`: 独立指定 Hover 高光旋转角度 |
| `TactileInput` | 凹陷槽位单行输入框 | 支持前置图标 `icon`、右侧快捷键徽标 `kbd`、聚焦高光环 |
| `TactileTextarea` | 凹陷槽位多行文本域 | 自适应高度调节、聚焦态对角高光环 |
| `TactileSelect` | 拟物下拉选择器 | 凸起触发器 + 浮动高光菜单面板 + 选项副标题说明 |
| `TactileSwitch` | 物理拨杆开关 | 凹槽轨道 + 金属高光凸起滑块 + 宝石状态指示灯 |
| `TactileCheckbox` | 拟物复选框 | 凹陷方槽 + 选中态金属填充与平滑勾选动效 |
| `TactileRadioGroup` | 拟物单选框组 | 凹陷圆环 + 发光金属内芯 |
| `TactileSlider` | 轨道数值滑块 | 金属进度填充轨道 + 立体球形金属滑块 |
| `TactileTabs` | 分段控制器 | 凹陷母槽 + 凸起对角高光激活标签 |
| `TactileBadge` | 状态徽章胶囊 | 支持 `'white' \| 'green' \| 'amber' \| 'crimson'` 呼吸灯点 |
| `TactileCard` | 对角高光容器卡片 | 支持标题、副标题、右上角徽章与操作区 |
| `TactileModal` | 模态对话框 | 毛玻璃背景遮罩 + 对角高光弹窗容器 |
| `ToastProvider` | 全局浮动通知 | 支持 `'success' \| 'info' \| 'error'` 触觉通知提示 |

---

## 🚀 快速开始 (Getting Started)

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

启动后在浏览器访问 `http://localhost:3000`。

### 3. 构建生产版本

```bash
npm run build
```

---

## 💻 使用示例 (Usage Example)

```tsx
import {
  TactileButton,
  TactileInput,
  TactileSwitch,
  TactileCard,
  TactileBadge,
} from './components/TactileComponents';
import { MetalConfigProvider } from './components/WebGLMetalEngine';

export default function Example() {
  return (
    <MetalConfigProvider>
      <TactileCard
        title="节点服务配置"
        description="默认使用经典暗色轻拟物，也可单组件指定物理金属材质"
        badge={<TactileBadge dotColor="green">Active</TactileBadge>}
      >
        <TactileInput placeholder="输入节点名称..." kbd="⌘K" />

        <div className="flex gap-3">
          {/* 跟随全局默认风格 (Classic Dark Tactile) */}
          <TactileButton variant="default">默认轻拟物按钮</TactileButton>

          {/* 独立指定 24K 黄金材质 */}
          <TactileButton material="gold">24K 黄金按钮</TactileButton>

          {/* 独立指定 Hover 时对角高光旋转 180° */}
          <TactileButton sweepDeg={180}>Hover 旋转 180°</TactileButton>
        </div>
      </TactileCard>
    </MetalConfigProvider>
  );
}
```

---

## 📁 目录结构 (Project Structure)

```text
├── index.html
├── package.json
├── src/
│   ├── App.tsx                         # shadcn/ui 风格主页面与导航架构
│   ├── index.css                       # 暗色轻拟物 CSS 变量、Houdini @property 与基础样式
│   ├── main.tsx                        # 应用入口
│   └── components/
│       ├── AudioEngine.ts              # Web Audio API 物理微动音效合成器
│       ├── ComponentDocs.tsx           # React / HTML 源码预览与一键复制生成器
│       ├── HeroEmblem.tsx              # 1:1 参考图 X 徽标按钮（支持轻拟物与 WebGL 金属）
│       ├── LightingLab.tsx             # 全局材质与光学参数定制控制台
│       ├── LiquidChromeLab.tsx         # 6 大 WebGL 物理金属图鉴与 GLSL 源码导出
│       ├── ShadcnExamplesGrid.tsx      # Cards 卡片墙、Dashboard 仪表盘与 Playground 示例
│       ├── TactileComponents.tsx       # 核心交互组件库（支持 Classic CSS 与 WebGL 双模式）
│       ├── TactileModal.tsx            # 轻拟物模态弹窗组件
│       ├── TactileToast.tsx            # 全局 Toast 消息通知组件
│       └── WebGLMetalEngine.tsx        # 共享单实例 WebGL GLSL 着色器引擎与全局状态 Context
```
