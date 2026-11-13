import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

export function ThemeCoveragePreview() {
  const [active, setActive] = useState("概览");
  return (
    <section className="space-y-6" aria-label="主题尺寸一致性预览">
      <div>
        <h2 className="mb-2 text-lg font-medium">同一尺寸基准</h2>
        <p className="text-sm text-muted-foreground">
          默认按钮、输入框、选择器、导航和标签页跟随共享高度。并列操作按外框对齐；紧凑尺寸为文字保留最小空间，触屏至少 40px。单独调整某一分类后，可用“自动”恢复跟随。
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm text-muted-foreground">
            Button / Input / Select
          </p>
          <div data-slot="control-row" className="flex flex-wrap gap-3">
            <Button data-audit="button">默认按钮</Button>
            <Input
              data-audit="input"
              aria-label="尺寸预览输入框"
              placeholder="输入设备名称"
              className="min-w-0 flex-[1_1_11rem]"
            />
            <Select defaultValue="north">
              <SelectTrigger
                data-audit="select"
                aria-label="尺寸预览选择器"
                className="min-w-0 flex-[1_1_11rem]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="north">北侧温室</SelectItem>
                <SelectItem value="south">南侧温室</SelectItem>
                <SelectItem value="offline" disabled>
                  暂不可用区域
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3 md:col-span-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">导航项圆角</p>
            <nav className="flex flex-wrap gap-2" aria-label="尺寸预览导航">
              {["概览", "历史", "设备"].map((name) => (
                <button
                  key={name}
                  data-slot="navigation-link"
                  data-audit="nav"
                  aria-pressed={active === name}
                  onClick={() => setActive(name)}
                >
                  {name}
                </button>
              ))}
            </nav>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tab 圆角</p>
            <Tabs defaultValue="readings">
              <TabsList>
                <TabsTrigger value="readings" data-audit="tab">
                  实时读数
                </TabsTrigger>
                <TabsTrigger value="events">事件记录</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          完整按钮尺寸 · XS / SM / Default / LG 与对应图标按钮
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {(["xs", "sm", "default", "lg"] as const).map((size) => (
            <Button
              key={size}
              size={size}
              variant="secondary"
              data-audit={"button-" + size}
            >
              {size}
            </Button>
          ))}
          {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((size) => (
            <Button
              key={size}
              size={size}
              variant="secondary"
              aria-label={size}
              data-audit={size}
            >
              <Plus />
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {(
            [
              "default",
              "secondary",
              "outline",
              "ghost",
              "destructive",
              "link",
            ] as const
          ).map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Input
            aria-label="无效输入预览"
            defaultValue="范围之外"
            aria-invalid
          />
          <Input aria-label="禁用输入预览" value="禁用输入" disabled readOnly />
          <Textarea
            aria-label="多行输入预览"
            placeholder="多行输入保留独立高度，不压成单行控件。"
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">弹窗预览</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>北侧温室</DialogTitle>
              <DialogDescription>ENV-001 · 温湿度传感器</DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">静态标签</Badge>
            <Badge variant="outline">待确认</Badge>
          </div>
          <Slider aria-label="尺寸预览滑块" defaultValue={[60]} />
          <div
            role="group"
            aria-label="大圆角预览"
            className="grid grid-cols-2 gap-3 text-sm text-muted-foreground *:grid *:h-[88px] *:place-items-center *:border *:border-border *:bg-muted"
          >
            <div className="rounded-3xl">3XL</div>
            <div className="rounded-4xl">4XL</div>
          </div>
          <table className="w-full text-left" aria-label="表格尺寸预览">
            <thead>
              <tr>
                <th data-slot="table-head">测点</th>
                <th data-slot="table-head">读数</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-slot="table-cell">空气温度</td>
                <td data-slot="table-cell">24.6 °C</td>
              </tr>
              <tr>
                <td data-slot="table-cell">相对湿度</td>
                <td data-slot="table-cell">68 %RH</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
