import { Panel } from "@/components/iot/internal/panel";
import { useState } from "react";
import { Ellipsis, Sprout } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const devices = [
  { name: "空气温度", state: "online", reading: "24.6 °C" },
  { name: "相对湿度", state: "online", reading: "68 %" },
  { name: "二氧化碳", state: "warning", reading: "1,420 ppm" },
];

export function FoundationExtensions() {
  const [filter, setFilter] = useState("all");
  const [interval, setIntervalValue] = useState("60");
  const [pinned, setPinned] = useState(false);
  const [message, setMessage] = useState("选择菜单项查看交互反馈。");
  return (
    <div className="foundation-extensions">
      <section>
        <h2>面板与凹陷区域</h2>
        <Panel icon={<Sprout />} title="北侧温室" description="环境观测">
          <div className="surface-inset space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">空气温度</span>
              <Badge variant="secondary" data-tone="success">
                正常
              </Badge>
            </div>
            <p className="text-3xl font-medium tabular-nums">
              24.6 <span className="text-sm text-muted-foreground">°C</span>
            </p>
            <p className="text-sm text-muted-foreground">12 秒前更新</p>
          </div>
        </Panel>
      </section>

      <section>
        <h2>导航与筛选</h2>
        <nav aria-label="基础导航示例" className="flex flex-wrap gap-2 mb-5">
          <a
            data-slot="navigation-link"
            href="#/components"
            aria-current="page"
          >
            组件
          </a>
          <a data-slot="navigation-link" href="#/blocks">
            场景
          </a>
          <a data-slot="navigation-link" href="#/icons">
            图标
          </a>
        </nav>
        <div
          aria-label="设备状态筛选"
          role="group"
          className="flex flex-wrap gap-2 mb-4"
        >
          {[
            ["all", "全部"],
            ["online", "正常"],
            ["warning", "需关注"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              data-slot="filter-chip"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
          <button type="button" data-slot="filter-chip" disabled>
            已归档
          </button>
        </div>
        <ul
          aria-live="polite"
          className="surface-inset divide-y divide-border/50 p-4"
        >
          {devices
            .filter((device) => filter === "all" || device.state === filter)
            .map((device) => (
              <li
                key={device.name}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>{device.name}</span>
                <span className="tabular-nums">{device.reading}</span>
              </li>
            ))}
        </ul>
      </section>

      <section>
        <h2>菜单与选择器</h2>
        <div className="flex flex-wrap items-end gap-5">
          <div className="grid gap-2">
            <Label htmlFor="foundation-interval">采样周期</Label>
            <Select value={interval} onValueChange={setIntervalValue}>
              <SelectTrigger id="foundation-interval" aria-label="采样周期">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value="30">30 秒</SelectItem>
                <SelectItem value="60">1 分钟</SelectItem>
                <SelectItem value="300">5 分钟</SelectItem>
                <SelectItem value="900" disabled>
                  15 分钟（不可用）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <Ellipsis aria-hidden="true" />
                更多操作
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>演示设备</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => setMessage("最新读数：24.6 °C，12 秒前更新。")}
              >
                显示最近读数
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={pinned}
                onCheckedChange={(value) => {
                  setPinned(value === true);
                  setMessage(value ? "已固定演示设备。" : "已取消固定。");
                }}
              >
                固定此设备
              </DropdownMenuCheckboxItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>读数详情</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={() => setMessage("最近一次采样在 12 秒前。")}
                  >
                    采样时间
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      setMessage("数据来源为北侧温室温湿度传感器。")
                    }
                  >
                    数据来源
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem disabled>重启设备（不可用）</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setPinned(false);
                  setMessage("演示标记已清除。");
                }}
              >
                清除演示标记
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {pinned && <Badge variant="secondary">已固定</Badge>}
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </section>

      <section>
        <h2>标签与状态</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>ENV-001</Badge>
          <Badge variant="secondary">LoRaWAN</Badge>
          <Badge variant="outline">温室 A</Badge>
          <Badge variant="secondary" data-tone="success">
            在线
          </Badge>
          <Badge variant="secondary" data-tone="warning">
            需关注
          </Badge>
          <Badge variant="destructive">故障</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          标签表达身份与状态；需要筛选时，使用上方带选中态的筛选按钮。
        </p>
      </section>
    </div>
  );
}
