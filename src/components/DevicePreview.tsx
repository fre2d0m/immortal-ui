import { useState } from "react";
import { DeviceProfile } from "@/components/iot/device-profile";
import { DeviceCard, type Device } from "@/components/iot/device-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deviceLink, stationDevices } from "@/lib/block-demo-data";

export function DevicePreview({ kind }: { kind: "card" | "profile" }) {
  const Component = kind === "profile" ? DeviceProfile : DeviceCard;
  const [scenario, setScenario] = useState("complete");
  const [serviceDevice, setServiceDevice] = useState<Device | null>(null);
  const [phase, setPhase] = useState("idle");
  const device: Device =
    scenario === "offline"
      ? stationDevices[3]
      : scenario === "missing"
        ? {
            id: "NEW-001",
            name: "待接入气象站",
            state: "unknown",
            location: "",
            protocol: "",
            rssi: null,
            lastSeen: "",
            battery: null,
          }
        : stationDevices[1];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">演示场景</span>
        <Select value={scenario} onValueChange={setScenario}>
          <SelectTrigger aria-label="设备档案场景" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="complete">完整档案</SelectItem>
            <SelectItem value="offline">离线设备</SelectItem>
            <SelectItem value="missing">资料缺失</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Component
        key={device.id}
        device={device}
        onOpen={
          scenario === "missing"
            ? undefined
            : (selected) => {
                window.location.hash = deviceLink(selected.id);
              }
        }
        onConfigure={
          scenario === "missing"
            ? undefined
            : (selected) => {
                window.location.hash =
                  "/blocks/device-control?device=" +
                  encodeURIComponent(selected.id);
              }
        }
        services={
          scenario === "missing"
            ? []
            : [
                {
                  id: "self-check",
                  label: "设备自检",
                  disabledReason:
                    device.state === "offline"
                      ? "设备离线，暂不可执行"
                      : undefined,
                },
              ]
        }
        onService={(_, selected) => {
          setServiceDevice(selected);
          setPhase("idle");
        }}
      />
      <Dialog
        open={!!serviceDevice}
        onOpenChange={(open) => {
          if (!open) setServiceDevice(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设备自检</DialogTitle>
            <DialogDescription>
              {serviceDevice?.name} · 演示服务，不连接真实设备
            </DialogDescription>
          </DialogHeader>
          {phase === "done" ? (
            <div role="status" className="space-y-3 text-sm">
              <p className="font-medium">演示自检已完成</p>
              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt>连接</dt>
                  <dd>正常</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>电量</dt>
                  <dd>{serviceDevice?.battery}%</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>采样模块</dt>
                  <dd>模拟检查通过</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              检查设备连接、电源和采样模块，结果显示在此处。
            </p>
          )}
          <Button
            disabled={phase === "running"}
            onClick={async () => {
              setPhase("running");
              await new Promise((resolve) => setTimeout(resolve, 450));
              setPhase("done");
            }}
          >
            {phase === "running"
              ? "正在自检…"
              : phase === "done"
                ? "重新自检"
                : "开始自检"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
