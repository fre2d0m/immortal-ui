import {
  DataCard,
  DataTimestamp,
  DataTimeWindow,
  type DataCardPresentation,
} from "@/components/iot/internal/data-card";
import type {
  CardDefinition,
  CardValue,
} from "@/components/iot/internal/data-card-model";
import { qualityLabels, type Quality } from "@/lib/iot-model";

export type IndicatorDefinition = CardDefinition;
export type IndicatorResult = {
  value: CardValue;
  calculatedAt: number | null;
  window?: { from: number; to: number };
  quality?: Quality;
  reason?: string;
};
export type IndicatorMethod = {
  label: string;
  version?: string;
  inputs?: string[];
};

/** A derived result; computation time, input window and method stay distinct. */
export function IndicatorCard({
  definition,
  result,
  method,
  ...presentation
}: DataCardPresentation & {
  definition: IndicatorDefinition;
  result: IndicatorResult;
  method: IndicatorMethod;
}) {
  return (
    <DataCard
      {...presentation}
      kind="indicator"
      definition={definition}
      value={result.value}
      invalid={result.quality === "bad"}
      message={result.reason}
      metadata={
        result.value === null && result.calculatedAt === null ? null : (
          <div className="space-y-2 text-muted-foreground">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {result.calculatedAt == null ? (
                <span>计算时间未知</span>
              ) : (
                <>
                  <span>计算于</span>
                  <DataTimestamp at={result.calculatedAt} />
                </>
              )}
              <span
                className={
                  result.quality === "bad"
                    ? "text-destructive"
                    : result.quality !== "good"
                      ? "text-warning-text"
                      : ""
                }
              >
                · {qualityLabels[result.quality ?? "unknown"]}
              </span>
            </div>
            {result.window && (
              <dl className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <dt>统计窗口</dt>
                <dd className="min-w-0">
                  <DataTimeWindow {...result.window} />
                </dd>
              </dl>
            )}
          </div>
        )
      }
      details={
        <>
          <div>
            <dt className="text-muted-foreground">计算方法</dt>
            <dd className="mt-1 wrap-anywhere">
              {method.label}
              {method.version && ` · ${method.version}`}
            </dd>
          </div>
          {!!method.inputs?.length && (
            <div className="@md:col-span-2">
              <dt className="text-muted-foreground">输入依据</dt>
              <dd className="mt-1 wrap-anywhere">{method.inputs.join("、")}</dd>
            </div>
          )}
        </>
      }
    />
  );
}
