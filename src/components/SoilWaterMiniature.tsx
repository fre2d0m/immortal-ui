import { useMemo } from "react";
import {
  prepareSoilData,
  createSoilView,
  soilHeatColor,
} from "@/components/blocks/soil-water-model";
import { soilHandCheckDemo } from "@/lib/soil-water-demo";

/** Same data preparation and colour encoding as the installable workbench. */
export function SoilWaterMiniature() {
  const { data, view } = useMemo(() => {
    const data = prepareSoilData(soilHandCheckDemo());
    return { data, view: createSoilView(data, data.window) };
  }, []);
  return (
    <div className="surface-inset p-3">
      <svg
        viewBox="0 0 280 120"
        role="img"
        aria-label="演示数据概览：3 个深度，8 小时时隙，包含缺测、零值、负值和越界值；进入预览核查记录"
      >
        {view.layers.map((layer, row) => (
          <g key={layer.id}>
            <text
              x="0"
              y={20 + row * 28}
              fill="var(--muted-foreground)"
              fontSize="10"
            >
              {layer.depthCm}
            </text>
            {layer.bins.map((bin, col) => (
              <rect
                key={bin.from}
                x={30 + col * 30}
                y={6 + row * 28}
                width="29"
                height="26"
                fill={
                  bin.mean === null
                    ? "var(--muted)"
                    : soilHeatColor(
                        bin.mean,
                        data.heatScale.min,
                        data.heatScale.max,
                      )
                }
              />
            ))}
          </g>
        ))}
        <text x="30" y="108" fill="var(--muted-foreground)" fontSize="10">
          12/31 22:00
        </text>
        <text
          x="270"
          y="108"
          textAnchor="end"
          fill="var(--muted-foreground)"
          fontSize="10"
        >
          01/01 06:00 UTC
        </text>
      </svg>
    </div>
  );
}
