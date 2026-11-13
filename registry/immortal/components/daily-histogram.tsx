import { Panel } from "@/components/iot/internal/panel";
import { ChartColumn } from "lucide-react";
import {
  numericScale,
  linearPosition,
  formatTelemetryNumber,
  formatAxisNumber,
} from "@/lib/telemetry";

/** Compatibility name. These are interval/category totals, not distribution bins. */
export type HistogramSample = { label: string; value: number | null };
export function DailyHistogram({
  label,
  data,
  unit,
  precision = 1,
  description,
  className,
}: {
  label: string;
  data: HistogramSample[];
  unit: string;
  precision?: number;
  /** Caller supplies interval, time zone and aggregation definition. */
  description?: string;
  className?: string;
}) {
  const scale = numericScale(
    data.flatMap((p) =>
      p.value !== null && Number.isFinite(p.value) ? [p.value] : [],
    ),
    undefined,
    true,
  );
  const zero = linearPosition(0, scale.min, scale.max) * 100;
  return (
    <Panel
      icon={<ChartColumn />}
      title={label}
      description={description ?? "按传入时段顺序比较；不在组件内聚合"}
      className={className}
    >
      {!data.length ? (
        <p className="py-8 text-sm text-muted-foreground">暂无时段数据</p>
      ) : (
        <figure className="min-w-0 space-y-3">
          <figcaption className="text-sm text-muted-foreground">
            从零比较 · {unit} · 范围 {formatAxisNumber(scale.min)}–
            {formatAxisNumber(scale.max)}。零值保留零线，缺测与无效不画条形。
          </figcaption>
          <div
            className="max-h-96 overflow-auto focus-visible:outline-2 focus-visible:outline-ring"
            tabIndex={0}
            role="region"
            aria-label={`${label}时段比较表`}
          >
            <table className="w-full text-sm">
              <caption className="sr-only">
                {label} · {description} · {unit}
              </caption>
              <thead className="sticky top-0 z-10 bg-card text-muted-foreground">
                <tr>
                  <th scope="col" className="p-2 text-left font-medium">
                    时段
                  </th>
                  <th
                    scope="col"
                    className="min-w-28 p-2 text-left font-medium"
                  >
                    相对零线
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap p-2 text-right font-medium"
                  >
                    读数（{unit}）
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((p, i) => {
                  const available =
                    p.value !== null && Number.isFinite(p.value);
                  const position = available
                    ? linearPosition(p.value!, scale.min, scale.max) * 100
                    : zero;
                  return (
                    <tr key={i} className="border-t border-border">
                      <th
                        scope="row"
                        className="min-w-24 p-2 text-left font-normal wrap-anywhere"
                      >
                        {p.label}
                      </th>
                      <td className="px-2">
                        <div aria-hidden="true" className="relative h-8">
                          <span
                            className="absolute inset-y-0 border-l border-muted-foreground"
                            style={{ left: `${zero}%` }}
                          />
                          {available && p.value !== 0 && (
                            <span
                              data-slot="interval-bar"
                              className="absolute top-2 h-4 rounded-sm bg-chart-1"
                              style={{
                                left: `${Math.min(zero, position)}%`,
                                width: `${Math.abs(position - zero)}%`,
                              }}
                            />
                          )}
                          {available && p.value === 0 && (
                            <span
                              className="absolute inset-y-1 border-l-[3px] border-foreground"
                              style={{ left: `${zero}%` }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap p-2 text-right tabular-nums">
                        {available
                          ? formatTelemetryNumber(p.value!, precision)
                          : p.value === null
                            ? "缺测"
                            : "无效"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </figure>
      )}
    </Panel>
  );
}
