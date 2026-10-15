import React, { useState } from 'react';
import {
  TactileButton,
  TactileInput,
  TactileTextarea,
  TactileSwitch,
  TactileCheckbox,
  TactileRadioGroup,
  TactileSlider,
  TactileSelect,
  TactileTabs,
  TactileBadge,
  TactileCard,
} from './TactileComponents';
import {
  METAL_MATERIALS,
  useMetalConfig,
  WebGLBezelCanvas,
} from './WebGLMetalEngine';
import { audioEngine } from './AudioEngine';
import { useToast } from './TactileToast';
import {
  CreditCard,
  Wallet,
  Cpu,
  Copy,
  Check,
  Bell,
  BellOff,
  Sparkles,
  Activity,
  DollarSign,
  Users,
  Zap,
  Play,
  RotateCcw,
  Terminal,
  ShieldCheck,
} from 'lucide-react';

/* =========================================================================
   1. Cards Example View (Recreating https://ui.shadcn.com/ Default Cards Grid)
   ========================================================================= */
export const ShadcnCardsExample: React.FC = () => {
  const { toast } = useToast();
  const { material } = useMetalConfig();
  const matPreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const isClassic = !matPreset.isWebGLMetal;

  // Card 1: Create Account
  const [email, setEmail] = useState('m@example.com');
  const [password, setPassword] = useState('••••••••••••');

  // Card 2: Payment Method
  const [payMethod, setPayMethod] = useState<'card' | 'paypal' | 'apple'>('card');
  const [cardName, setCardName] = useState('Lee Robinson');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8891');
  const [expMonth, setExpMonth] = useState('08');
  const [expYear, setExpYear] = useState('2028');
  const [cvc, setCvc] = useState('842');

  // Card 3: Team Members
  const [roleSofia, setRoleSofia] = useState('owner');
  const [roleJackson, setRoleJackson] = useState('developer');
  const [roleIsabella, setRoleIsabella] = useState('billing');

  // Card 4: Share Document
  const [shareUrl] = useState('https://ui.tactile.dev/share/9f8c-dark-skeuo');
  const [copiedShare, setCopiedShare] = useState(false);
  const [accessLevel, setAccessLevel] = useState('write');

  // Card 5: Notifications
  const [notifMode, setNotifMode] = useState<'all' | 'mentions' | 'none'>('all');
  const [pushNotif, setPushNotif] = useState(true);

  // Card 6: Cookie Settings
  const [cookieNecessary, setCookieNecessary] = useState(true);
  const [cookieFunctional, setCookieFunctional] = useState(false);
  const [cookieSpecular, setCookieSpecular] = useState(true);

  // Card 7: Report an Issue
  const [issueArea, setIssueArea] = useState('billing');
  const [issueSeverity, setIssueSeverity] = useState('2');
  const [issueSubject, setIssueSubject] = useState('');
  const [issueDesc, setIssueDesc] = useState('');

  // Card 8: Compute Quota
  const [computeGoal, setComputeGoal] = useState(350);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    audioEngine.playClick('metal');
    toast({
      title: '分享链接已复制',
      description: shareUrl,
      type: 'success',
    });
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {/* ==================== COLUMN 1 ==================== */}
      <div className="flex flex-col gap-6">
        {/* Card 1: Create an account */}
        <TactileCard
          title="创建开发者账户 (Create an account)"
          description="输入您的邮箱与凭证，或使用第三方通行证快速接入"
          badge={<TactileBadge dotColor="white">Auth</TactileBadge>}
        >
          <div className="grid grid-cols-2 gap-3">
            <TactileButton
              variant="default"
              onClick={() =>
                toast({ title: '已触发 GitHub OAuth 鉴权', type: 'info' })
              }
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              }
            >
              GitHub
            </TactileButton>
            <TactileButton
              variant="default"
              onClick={() =>
                toast({ title: '已触发 X (Twitter) OAuth 鉴权', type: 'info' })
              }
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
            >
              X Corp
            </TactileButton>
          </div>

          <div className="relative flex items-center justify-center my-0.5">
            <div className="border-t border-white/[0.07] w-full" />
            <span className="bg-[#0b0b0e] px-2.5 text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">
              Or continue with
            </span>
            <div className="border-t border-white/[0.07] w-full" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-300">邮箱地址 (Email)</label>
              <TactileInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-300">登录密码 (Password)</label>
              <TactileInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <TactileButton
            variant="metallic"
            className="w-full"
            onClick={() =>
              toast({
                title: '开发者账户创建成功',
                description: `欢迎加入，验证邮件已发送至 ${email}`,
                type: 'success',
              })
            }
          >
            立即创建账户 (Create account)
          </TactileButton>
        </TactileCard>

        {/* Card 2: Payment Method */}
        <TactileCard
          title="支付与结算方式 (Payment Method)"
          description="为算力集群绑定账单结算方式，支持实时高光选中态"
        >
          {/* 3-Tile Payment Selector */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'card', label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
              { id: 'paypal', label: 'PayPal', icon: <Wallet className="w-5 h-5" /> },
              { id: 'apple', label: 'Apple', icon: <Cpu className="w-5 h-5" /> },
            ].map((item) => {
              const active = payMethod === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    audioEngine.playClick('select');
                    setPayMethod(item.id as 'card' | 'paypal' | 'apple');
                  }}
                  style={
                    isClassic
                      ? {
                          backgroundImage: `${
                            active ? 'var(--bg-convex-hover)' : 'var(--bg-subcard)'
                          }, ${active ? 'var(--border-rim-focus)' : 'var(--border-rim-subtle)'}`,
                          backgroundOrigin: 'padding-box, border-box',
                          backgroundClip: 'padding-box, border-box',
                          boxShadow: active ? 'var(--shadow-convex-sm)' : 'none',
                        }
                      : {
                          padding: active ? '2px' : '1px',
                        }
                  }
                  className={`relative h-20 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isClassic ? 'border border-transparent' : ''
                  }`}
                >
                  {!isClassic && (
                    <WebGLBezelCanvas
                      material={material}
                      dimmed={!active}
                      hovered={active}
                      sweepDeg={0}
                      canvasWidth={120}
                      canvasHeight={80}
                    />
                  )}
                  <div
                    style={!isClassic ? { background: matPreset.capGradient } : undefined}
                    className={
                      isClassic
                        ? 'flex flex-col items-center justify-center gap-1.5'
                        : 'relative z-10 w-full h-full rounded-[10px] flex flex-col items-center justify-center gap-1.5'
                    }
                  >
                    <span
                      style={{ color: active ? matPreset.accentHex : '#a1a1aa' }}
                      className="transition-colors"
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        active ? 'text-zinc-100' : 'text-zinc-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-300">持卡人姓名 (Name)</label>
              <TactileInput
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="First Last"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-300">卡号 (Card number)</label>
              <TactileInput
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                kbd="VISA"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <TactileSelect
                label="月份 (Expires)"
                value={expMonth}
                onChange={setExpMonth}
                options={[
                  { value: '01', label: '01 月' },
                  { value: '04', label: '04 月' },
                  { value: '08', label: '08 月' },
                  { value: '12', label: '12 月' },
                ]}
              />
              <TactileSelect
                label="年份 (Year)"
                value={expYear}
                onChange={setExpYear}
                options={[
                  { value: '2026', label: '2026' },
                  { value: '2027', label: '2027' },
                  { value: '2028', label: '2028' },
                  { value: '2030', label: '2030' },
                ]}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">安全码 (CVC)</label>
                <TactileInput
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          <TactileButton
            variant="default"
            className="w-full"
            onClick={() =>
              toast({
                title: '支付方式已绑定',
                description: `持卡人 ${cardName} (${payMethod.toUpperCase()}) 校验通过`,
                type: 'success',
              })
            }
          >
            继续并保存 (Continue)
          </TactileButton>
        </TactileCard>
      </div>

      {/* ==================== COLUMN 2 ==================== */}
      <div className="flex flex-col gap-6">
        {/* Card 3: Team Members */}
        <TactileCard
          title="团队成员与权限 (Team Members)"
          description="管理组织成员对组件库与算力集群的访问角色"
          badge={<TactileBadge dotColor="green">3 Active</TactileBadge>}
        >
          <div className="flex flex-col gap-3.5">
            {[
              {
                initials: 'SD',
                name: 'Sofia Davis',
                email: 'm@example.com',
                role: roleSofia,
                setRole: setRoleSofia,
              },
              {
                initials: 'JL',
                name: 'Jackson Lee',
                email: 'p@example.com',
                role: roleJackson,
                setRole: setRoleJackson,
              },
              {
                initials: 'IN',
                name: 'Isabella Nguyen',
                email: 'i@example.com',
                role: roleIsabella,
                setRole: setRoleIsabella,
              },
            ].map((member) => (
              <div
                key={member.email}
                className="flex items-center justify-between gap-3 py-1"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={{
                      backgroundImage: `var(--bg-convex), var(--border-rim-subtle)`,
                      backgroundOrigin: 'padding-box, border-box',
                      backgroundClip: 'padding-box, border-box',
                      color: matPreset.accentHex,
                    }}
                    className="w-9 h-9 rounded-full border border-transparent flex items-center justify-center text-xs font-bold shrink-0 shadow-md"
                  >
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-zinc-100 truncate">
                      {member.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{member.email}</div>
                  </div>
                </div>
                <div className="w-36 shrink-0">
                  <TactileSelect
                    value={member.role}
                    onChange={member.setRole}
                    options={[
                      { value: 'owner', label: 'Owner (所有者)', description: '全量管理权限' },
                      { value: 'developer', label: 'Developer', description: '部署与调试权限' },
                      { value: 'billing', label: 'Billing', description: '账单与配额查看' },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </TactileCard>

        {/* Card 4: Share this document */}
        <TactileCard
          title="分享工程与访问令牌 (Share this document)"
          description="任何持有该轻拟物密钥链接的成员均可按权限检视组件"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <TactileInput value={shareUrl} readOnly />
            </div>
            <TactileButton
              variant="default"
              onClick={handleCopyShare}
              icon={
                copiedShare ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
            >
              {copiedShare ? '已复制' : '复制'}
            </TactileButton>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-3">
            <div className="text-xs font-medium text-zinc-300">默认访问级别 (Access Level)</div>
            <TactileRadioGroup
              name="shareAccess"
              value={accessLevel}
              onChange={setAccessLevel}
              options={[
                { value: 'write', label: '读写权限 (Read & Write)' },
                { value: 'read', label: '仅只读预览 (Read Only)' },
              ]}
            />
          </div>
        </TactileCard>

        {/* Card 5: Notifications */}
        <TactileCard
          title="通知订阅策略 (Notifications)"
          description="选择您需要接收的物理音效与系统告警级别"
        >
          <div className="flex flex-col gap-2">
            {[
              {
                id: 'all',
                title: '全部实时动态 (Everything)',
                desc: '所有节点部署、告警与提及均推送通知',
                icon: <Bell className="w-4 h-4" />,
              },
              {
                id: 'mentions',
                title: '仅提及与高优告警 (Available)',
                desc: '仅在被 @提及 或集群负载超阈值时提醒',
                icon: <Sparkles className="w-4 h-4" />,
              },
              {
                id: 'none',
                title: '静默免打扰 (Ignoring)',
                desc: '关闭所有弹窗提示，仅保留后台日志记录',
                icon: <BellOff className="w-4 h-4" />,
              },
            ].map((item) => {
              const active = notifMode === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    audioEngine.playClick('select');
                    setNotifMode(item.id as 'all' | 'mentions' | 'none');
                  }}
                  style={{
                    backgroundImage: `${
                      active ? 'var(--bg-convex)' : 'var(--bg-subcard)'
                    }, ${active ? 'var(--border-rim)' : 'var(--border-rim-subtle)'}`,
                    backgroundOrigin: 'padding-box, border-box',
                    backgroundClip: 'padding-box, border-box',
                  }}
                  className="p-3 rounded-xl border border-transparent flex items-start gap-3 cursor-pointer transition-all"
                >
                  <span
                    style={{ color: active ? matPreset.accentHex : '#71717a' }}
                    className="mt-0.5"
                  >
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-zinc-100">{item.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <TactileCheckbox
              checked={pushNotif}
              onChange={setPushNotif}
              label="同时开启 Web Audio 机械微动合成音效"
              hint="点击按钮或拨动开关时发出真实物理微动声"
            />
          </div>
        </TactileCard>
      </div>

      {/* ==================== COLUMN 3 ==================== */}
      <div className="flex flex-col gap-6">
        {/* Card 6: Cookie & Optical Preferences */}
        <TactileCard
          title="隐私与光学偏好 (Cookie & Optical Settings)"
          description="管理本地存储权限与硬件高光着色渲染开关"
          badge={<TactileBadge dotColor="amber">Preferences</TactileBadge>}
        >
          <div className="flex flex-col gap-3">
            <TactileSwitch
              checked={cookieNecessary}
              onChange={setCookieNecessary}
              label="核心安全凭据 (Strictly Necessary)"
              hint="维持会话鉴权与防跨站请求伪造所必需的存储"
            />
            <TactileSwitch
              checked={cookieFunctional}
              onChange={setCookieFunctional}
              label="个性化风格记忆 (Functional)"
              hint="记住您选择的暗色轻拟物或金属材质配置"
            />
            <TactileSwitch
              checked={cookieSpecular}
              onChange={setCookieSpecular}
              label="135° 对角双高光渲染 (Specular Rim)"
              hint="启用左上主高光与右下环境反光的微立体倒角"
            />
          </div>

          <TactileButton
            variant="recessed"
            className="w-full"
            onClick={() =>
              toast({
                title: '偏好设置已保存',
                description: '您的隐私与光学配置已更新至本地',
                type: 'success',
              })
            }
          >
            保存偏好设置 (Save preferences)
          </TactileButton>
        </TactileCard>

        {/* Card 7: Report an Issue */}
        <TactileCard
          title="提交工单反馈 (Report an issue)"
          description="遇到渲染异常或需要定制新组件？请告诉我们"
        >
          <div className="grid grid-cols-2 gap-3">
            <TactileSelect
              label="所属模块 (Area)"
              value={issueArea}
              onChange={setIssueArea}
              options={[
                { value: 'billing', label: 'Billing (账单结算)' },
                { value: 'webgl', label: 'WebGL 着色器' },
                { value: 'components', label: 'UI 组件交互' },
              ]}
            />
            <TactileSelect
              label="严重级别 (Severity)"
              value={issueSeverity}
              onChange={setIssueSeverity}
              options={[
                { value: '1', label: 'Severity 1 (最高)' },
                { value: '2', label: 'Severity 2 (中等)' },
                { value: '3', label: 'Severity 3 (建议)' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-300">工单标题 (Subject)</label>
            <TactileInput
              value={issueSubject}
              onChange={(e) => setIssueSubject(e.target.value)}
              placeholder="I need help with..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-300">详细描述 (Description)</label>
            <TactileTextarea
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              placeholder="请描述复现步骤或期望的拟物光影效果..."
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <TactileButton
              variant="recessed"
              onClick={() => {
                setIssueSubject('');
                setIssueDesc('');
              }}
            >
              取消 (Cancel)
            </TactileButton>
            <TactileButton
              variant="metallic"
              onClick={() =>
                toast({
                  title: '工单已提交',
                  description: '工程团队将在 15 分钟内响应您的反馈',
                  type: 'success',
                })
              }
            >
              提交工单 (Submit)
            </TactileButton>
          </div>
        </TactileCard>

        {/* Card 8: Compute Goal & Telemetry */}
        <TactileCard
          title="算力配额调节 (Compute Goal)"
          description="动态调节每日 GPU 推理吞吐配额上限"
        >
          <div className="flex items-center justify-between py-1">
            <TactileButton
              variant="recessed"
              size="icon"
              onClick={() => setComputeGoal(Math.max(100, computeGoal - 50))}
            >
              -
            </TactileButton>
            <div className="text-center">
              <div
                style={{ color: matPreset.accentHex }}
                className="text-3xl font-bold font-mono tracking-tight"
              >
                {computeGoal}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                TFLOPS / DAY
              </div>
            </div>
            <TactileButton
              variant="recessed"
              size="icon"
              onClick={() => setComputeGoal(Math.min(800, computeGoal + 50))}
            >
              +
            </TactileButton>
          </div>

          {/* Mini Tactile Bar Chart */}
          <div className="flex items-end justify-between gap-1.5 h-16 px-2 pt-2">
            {[45, 70, 52, 88, 64, 95, 78, 60, 84, 92, 68, 80].map((v, i) => (
              <div
                key={i}
                style={{
                  height: `${Math.min(100, Math.round((v * computeGoal) / 400))}%`,
                  background: matPreset.swatchGradient,
                }}
                className="flex-1 rounded-t-sm opacity-85 transition-all duration-300"
              />
            ))}
          </div>

          <TactileSlider
            label="快捷滑块调节"
            value={computeGoal}
            min={100}
            max={800}
            step={25}
            unit=" TF"
            onChange={setComputeGoal}
          />
        </TactileCard>
      </div>
    </div>
  );
};

/* =========================================================================
   2. Dashboard Example View (Recreating https://ui.shadcn.com/examples/dashboard)
   ========================================================================= */
export const ShadcnDashboardExample: React.FC = () => {
  const { material } = useMetalConfig();
  const matPreset = METAL_MATERIALS[material] || METAL_MATERIALS.classic;
  const [rangeTab, setRangeTab] = useState('overview');

  const kpis = [
    {
      title: '算力总营收 (Total Revenue)',
      value: '$45,231.89',
      change: '+20.1% 较上月同比增长',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      title: '活跃订阅节点 (Subscriptions)',
      value: '+2,350',
      change: '+180.1% 集群扩缩容增长',
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: '每秒令牌吞吐 (Token/s)',
      value: '12,234',
      change: '+19% 硬件着色加速提升',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      title: '在线算力实例 (Active Now)',
      value: '+573',
      change: '+201 过去一小时新增',
      icon: <Activity className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <TactileTabs
            activeId={rangeTab}
            onChange={setRangeTab}
            tabs={[
              { id: 'overview', label: 'Overview (总览)' },
              { id: 'analytics', label: 'Analytics (分析)' },
              { id: 'reports', label: 'Reports (报表)' },
            ]}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <TactileBadge dotColor="green">集群状态：健康</TactileBadge>
          <TactileButton variant="metallic" size="sm">
            导出遥测报告 (Download)
          </TactileButton>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <TactileCard key={kpi.title}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{kpi.title}</span>
              <span style={{ color: matPreset.accentHex }} className="opacity-80">
                {kpi.icon}
              </span>
            </div>
            <div>
              <div
                style={{ color: matPreset.accentHex }}
                className="text-2xl font-bold font-mono tracking-tight"
              >
                {kpi.value}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">{kpi.change}</p>
            </div>
          </TactileCard>
        ))}
      </div>

      {/* Main Chart + Recent Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <TactileCard
          title="月度算力吞吐趋势 (Overview)"
          description="过去 12 个月各集群推理负载与光追渲染吞吐量"
          className="lg:col-span-4"
        >
          <div className="h-64 flex items-end justify-between gap-2.5 pt-6 px-2">
            {[
              { m: 'Jan', h: 42 },
              { m: 'Feb', h: 68 },
              { m: 'Mar', h: 54 },
              { m: 'Apr', h: 82 },
              { m: 'May', h: 61 },
              { m: 'Jun', h: 94 },
              { m: 'Jul', h: 76 },
              { m: 'Aug', h: 88 },
              { m: 'Sep', h: 65 },
              { m: 'Oct', h: 98 },
              { m: 'Nov', h: 84 },
              { m: 'Dec', h: 91 },
            ].map((bar) => (
              <div key={bar.m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  style={{
                    height: `${bar.h}%`,
                    background: matPreset.swatchGradient,
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 4px 12px rgba(0,0,0,0.8)',
                  }}
                  className="w-full rounded-t-md transition-all duration-300 hover:opacity-100 opacity-90"
                />
                <span className="text-[10px] font-mono text-zinc-500">{bar.m}</span>
              </div>
            ))}
          </div>
        </TactileCard>

        <TactileCard
          title="近期节点调用记录 (Recent Deployments)"
          description="本月已完成 265 次高可用算力结算"
          className="lg:col-span-3"
        >
          <div className="flex flex-col gap-4">
            {[
              { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+$1,999.00' },
              { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+$39.00' },
              { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '+$299.00' },
              { name: 'William Kim', email: 'will@email.com', amount: '+$99.00' },
              { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '+$39.00' },
            ].map((row) => (
              <div key={row.email} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={{
                      backgroundImage: `var(--bg-convex), var(--border-rim-subtle)`,
                      backgroundOrigin: 'padding-box, border-box',
                      backgroundClip: 'padding-box, border-box',
                      color: matPreset.accentHex,
                    }}
                    className="w-8 h-8 rounded-full border border-transparent flex items-center justify-center text-xs font-semibold shrink-0"
                  >
                    {row.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-zinc-100 truncate">
                      {row.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{row.email}</div>
                  </div>
                </div>
                <div
                  style={{ color: matPreset.accentHex }}
                  className="text-xs sm:text-sm font-mono font-semibold shrink-0"
                >
                  {row.amount}
                </div>
              </div>
            ))}
          </div>
        </TactileCard>
      </div>
    </div>
  );
};

/* =========================================================================
   3. Playground Example View (Recreating https://ui.shadcn.com/examples/playground)
   ========================================================================= */
export const ShadcnPlaygroundExample: React.FC = () => {
  const { toast } = useToast();
  const [model, setModel] = useState('grok-metal');
  const [temp, setTemp] = useState(56);
  const [maxLen, setMaxLen] = useState(2048);
  const [topP, setTopP] = useState(90);
  const [streamMode, setStreamMode] = useState(true);
  const [promptText, setPromptText] = useState(
    'You are an expert UI architect specializing in Dark Light-Skeuomorphism (135° diagonal dual-specular rims, obsidian convex surfaces, and WebGL metallic shaders).\n\nGenerate a clean, accessible button and input specification.'
  );

  return (
    <TactileCard
      title="AI 光学推理工作台 (Playground)"
      description="复刻 shadcn/ui Playground 布局，实时体验多行文本域、滑块与选择器协同手感"
      badge={<TactileBadge dotColor="amber">Interactive</TactileBadge>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <TactileTextarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="min-h-[240px] font-mono text-xs"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <TactileButton
                variant="metallic"
                icon={<Play className="w-3.5 h-3.5" />}
                onClick={() =>
                  toast({
                    title: '推理任务已提交',
                    description: `模型 ${model} · Temperature ${(temp / 100).toFixed(2)}`,
                    type: 'success',
                  })
                }
              >
                执行生成 (Submit)
              </TactileButton>
              <TactileButton
                variant="recessed"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => setPromptText('')}
              >
                清空画布
              </TactileButton>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Tokens: {Math.max(1, Math.round(promptText.length / 4))} / {maxLen}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <TactileSelect
            label="基础模型 (Model)"
            value={model}
            onChange={setModel}
            options={[
              { value: 'grok-metal', label: 'tactile-metal-v3', description: '高反差拟物推理内核' },
              { value: 'linear-fast', label: 'linear-instant-v2', description: '极速低延迟生成' },
              { value: 'obsidian-pro', label: 'obsidian-codex', description: '代码与着色器生成' },
            ]}
          />

          <TactileSlider
            label="采样温度 (Temperature)"
            value={temp}
            min={0}
            max={100}
            unit="%"
            onChange={setTemp}
          />

          <TactileSlider
            label="最大长度 (Max Length)"
            value={maxLen}
            min={256}
            max={4096}
            step={256}
            unit=" T"
            onChange={setMaxLen}
          />

          <TactileSlider
            label="核采样阈值 (Top P)"
            value={topP}
            min={10}
            max={100}
            unit="%"
            onChange={setTopP}
          />

          <TactileSwitch
            checked={streamMode}
            onChange={setStreamMode}
            label="流式响应输出"
            hint="60fps 实时渲染生成结果"
          />
        </div>
      </div>
    </TactileCard>
  );
};
