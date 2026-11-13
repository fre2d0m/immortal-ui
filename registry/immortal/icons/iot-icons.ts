import { createLucideIcon } from "lucide-react";

// Original Immortal UI SVG extensions. Match Lucide's 24px canvas,
// currentColor, 2px stroke and rounded caps/joins through createLucideIcon.
export const FlowMeter = createLucideIcon("FlowMeter", [
  ["circle", { cx: 12, cy: 12, r: 6, key: "body" }],
  ["path", { d: "M2 10h4M2 14h4m12-4h4m-4 4h4", key: "pipe" }],
  ["path", { d: "m12 12 3-3", key: "needle" }],
]);

export const AirQuality = createLucideIcon("AirQuality", [
  ["path", { d: "M3 6c3-3 6 3 9 0s6 3 9 0", key: "air" }],
  ["path", { d: "M3 11c3-3 6 3 9 0s6 3 9 0", key: "flow" }],
  ["circle", { cx: 5, cy: 18, r: 1, key: "particle-a" }],
  ["circle", { cx: 12, cy: 17, r: 1, key: "particle-b" }],
  ["circle", { cx: 19, cy: 18, r: 1, key: "particle-c" }],
]);

export const WaterPump = createLucideIcon("WaterPump", [
  ["path", { d: "M10 6h10v4h-4v2a6 6 0 1 1-6-6Z", key: "housing" }],
  ["circle", { cx: 10, cy: 12, r: 2, key: "impeller" }],
  ["path", { d: "M2 10h2m-2 4h2m3 4v3m6-3v3M5 21h10", key: "fittings" }],
]);

export const Valve = createLucideIcon("Valve", [
  ["path", { d: "m4 8 8 4-8 4Zm16 0-8 4 8 4Z", key: "body" }],
  ["path", { d: "M12 12V4M8 4h8M2 12h2m16 0h2", key: "stem" }],
]);

export const ElectricMotor = createLucideIcon("ElectricMotor", [
  ["rect", { x: 4, y: 7, width: 14, height: 10, rx: 2, key: "body" }],
  ["path", { d: "M9 7V3h4v4m5 5h4M7 17v4m8-4v4M5 21h12", key: "frame" }],
  ["path", { d: "M8 11v2m4-2v2", key: "fins" }],
]);

export const FieldBus = createLucideIcon("FieldBus", [
  ["path", { d: "M3 12h18M5 12v4m7-8v4m7 0v4", key: "bus" }],
  ["rect", { x: 3, y: 16, width: 4, height: 4, rx: 1, key: "node-a" }],
  ["rect", { x: 10, y: 4, width: 4, height: 4, rx: 1, key: "node-b" }],
  ["rect", { x: 17, y: 16, width: 4, height: 4, rx: 1, key: "node-c" }],
]);

export const Pipeline = createLucideIcon("Pipeline", [
  [
    "path",
    { d: "M3 6h11a4 4 0 0 1 4 4v11M3 12h8a1 1 0 0 1 1 1v8", key: "elbow" },
  ],
  ["path", { d: "M3 4v10m7 7h10", key: "flanges" }],
]);

export const StorageTank = createLucideIcon("StorageTank", [
  ["ellipse", { cx: 12, cy: 6, rx: 7, ry: 3, key: "top" }],
  ["path", { d: "M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6", key: "body" }],
  ["path", { d: "M5 14c2-2 5 2 7 0s5 2 7 0", key: "level" }],
]);

export const DeviceEnclosure = createLucideIcon("DeviceEnclosure", [
  ["rect", { x: 4, y: 2, width: 16, height: 17, rx: 2, key: "body" }],
  ["path", { d: "M8 7h8m0 5v2M8 19v3m8-3v3", key: "fittings" }],
]);

export const HeatEnergy = createLucideIcon("HeatEnergy", [
  [
    "path",
    {
      d: "M6 3c-4 4 4 8 0 12M12 3c-4 4 4 8 0 12M18 3c-4 4 4 8 0 12",
      key: "heat",
    },
  ],
  ["path", { d: "M3 21h18", key: "base" }],
]);
