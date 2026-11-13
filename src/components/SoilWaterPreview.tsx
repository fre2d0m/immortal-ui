import { useMemo, useState } from "react";
import { SoilWaterExplorer } from "@/components/blocks/soil-water-explorer";
import type { SoilWaterExport } from "@/components/blocks/soil-water-model";
import { annualSoilDemo, soilHandCheckDemo } from "@/lib/soil-water-demo";
import { Button } from "@/components/ui/button";

function download(result: SoilWaterExport) {
  const blob = new Blob(
    [
      JSON.stringify(
        result,
        (_key, value) =>
          typeof value === "number" && !Number.isFinite(value)
            ? String(value)
            : value,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${result.datasetId}-${new Date(result.window.from).toISOString().slice(0, 10)}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SoilWaterPreview() {
  const [scenario, setScenario] = useState("year");
  const data = useMemo(
    () =>
      scenario === "check"
        ? soilHandCheckDemo()
        : scenario === "empty"
          ? {
              ...annualSoilDemo(),
              id: "empty-soil",
              title: "无记录样地",
              depths: [],
              events: [],
              rainfall: undefined,
              et0: undefined,
              kc: undefined,
            }
          : annualSoilDemo(),
    [scenario],
  );
  return (
    <section
      className="preview-shell block-preview soil-water-preview"
      aria-label="年度土壤分析交互预览"
    >
      <div className="block-preview-bar">
        <p className="block-preview-label">
          交互预览 <span>演示数据</span>
        </p>
        <div className="block-preview-options" data-slot="control-row">
          <Button
            variant="ghost"
            aria-pressed={scenario === "year"}
            onClick={() => setScenario("year")}
          >
            全年 · 20 层
          </Button>
          <Button
            variant="ghost"
            aria-pressed={scenario === "focus"}
            onClick={() => setScenario("focus")}
          >
            重叠事件
          </Button>
          <Button
            variant="ghost"
            aria-pressed={scenario === "check"}
            onClick={() => setScenario("check")}
          >
            核对样例
          </Button>
          <Button
            variant="ghost"
            aria-pressed={scenario === "empty"}
            onClick={() => setScenario("empty")}
          >
            空数据
          </Button>
        </div>
      </div>
      <SoilWaterExplorer
        key={scenario}
        data={data}
        initialWindow={
          scenario === "focus"
            ? { from: Date.UTC(2025, 6, 10), to: Date.UTC(2025, 6, 17) }
            : undefined
        }
        initialDepthIds={
          scenario === "year" || scenario === "focus"
            ? ["d10", "d50", "d150"]
            : undefined
        }
        initialCursorAt={
          scenario === "year" || scenario === "focus"
            ? Date.UTC(2025, 6, 12, 12)
            : undefined
        }
        onExport={download}
      />
    </section>
  );
}
