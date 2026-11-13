import {
  DataCard,
  DataTimestamp,
  type DataCardPresentation,
} from "@/components/iot/internal/data-card";
import type {
  ScalarDefinition,
  ScalarValue,
} from "@/components/iot/internal/data-card-model";
import { DataFreshness } from "@/components/iot/data-freshness";
import { type Quality } from "@/lib/iot-model";

export type MetricDefinition = ScalarDefinition & {
  expectedInterval?: number;
  resolution?: number;
};
export type MetricObservation = {
  value: ScalarValue;
  sampledAt: number | null;
  receivedAt?: number | null;
  quality?: Quality;
  reason?: string;
};
export type MetricSource = {
  device: string;
  channel?: string;
  offline?: boolean;
};

/** A reported observation, its measurement definition and acquisition context. */
export function MetricCard({
  definition,
  observation,
  source,
  now,
  ...presentation
}: DataCardPresentation & {
  definition: MetricDefinition;
  observation: MetricObservation;
  source: MetricSource;
  now: number;
}) {
  return (
    <DataCard
      {...presentation}
      kind="metric"
      definition={definition}
      value={observation.value}
      invalid={observation.quality === "bad"}
      message={
        observation.reason ||
        (source.offline ? "设备离线 · 保留最后观测值" : undefined)
      }
      metadata={
        observation.value === null && observation.sampledAt === null ? null : (
          <DataFreshness
            quality={observation.quality}
            sampledAt={observation.sampledAt}
            now={now}
            expectedInterval={definition.expectedInterval}
            offline={source.offline}
          />
        )
      }
      details={
        <>
          <div>
            <dt className="text-muted-foreground">观测来源</dt>
            <dd className="mt-1 wrap-anywhere">
              {source.device}
              {source.channel && ` · ${source.channel}`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">采样时间</dt>
            <dd className="mt-1 tabular-nums">
              {observation.sampledAt == null ? (
                "未知"
              ) : (
                <DataTimestamp at={observation.sampledAt} />
              )}
            </dd>
          </div>
          {observation.receivedAt != null && (
            <div>
              <dt className="text-muted-foreground">接收时间</dt>
              <dd className="mt-1 tabular-nums">
                <DataTimestamp at={observation.receivedAt} />
              </dd>
            </div>
          )}
          {definition.resolution != null && definition.type === "number" && (
            <div>
              <dt className="text-muted-foreground">采样分辨率</dt>
              <dd className="mt-1">
                {definition.resolution} {definition.unit}
              </dd>
            </div>
          )}
          {definition.expectedInterval != null && (
            <div>
              <dt className="text-muted-foreground">预期采样间隔</dt>
              <dd className="mt-1">{definition.expectedInterval} 秒</dd>
            </div>
          )}
          {definition.type === "number" && definition.range && (
            <div>
              <dt className="text-muted-foreground">测量范围</dt>
              <dd className="mt-1 tabular-nums">
                {definition.range.min}–{definition.range.max} {definition.unit}
              </dd>
            </div>
          )}
        </>
      }
    />
  );
}
