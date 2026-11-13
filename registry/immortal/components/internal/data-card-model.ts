export type DataTone = "neutral" | "positive" | "warning" | "negative";
export type ScalarValue = number | string | boolean | null;
export type CardValue = ScalarValue | Record<string, ScalarValue>[];

type Identity = {
  id: string;
  label: string;
  subject: string;
  description?: string;
};
export type ScalarDefinition = Identity &
  (
    | {
        type: "number";
        unit: string;
        precision?: number;
        range?: {
          min: number;
          max: number;
          target?: { low: number; high: number };
        };
      }
    | {
        type: "state";
        states: { value: string | boolean; label: string; tone?: DataTone }[];
      }
    | { type: "text" }
  );
export type CardDefinition =
  | ScalarDefinition
  | (Identity & {
      type: "table";
      columns: {
        key: string;
        label: string;
        unit?: string;
        precision?: number;
      }[];
    });
export type MetricComparison = {
  label: string;
  referenceValue: number;
  mode: "absolute" | "relative" | "percentage-points";
  /** Assessment is supplied by the application, never inferred from direction. */
  tone?: DataTone;
};

export function comparisonValue(value: number, comparison: MetricComparison) {
  if (!Number.isFinite(value) || !Number.isFinite(comparison.referenceValue))
    return null;
  const difference = value - comparison.referenceValue;
  if (comparison.mode === "relative") {
    return comparison.referenceValue === 0
      ? null
      : (difference / Math.abs(comparison.referenceValue)) * 100;
  }
  return difference;
}

export function numberLabel(value: number, precision = 1) {
  if (!Number.isFinite(value)) return "—";
  const digits = Number.isFinite(precision)
    ? Math.max(0, Math.min(6, Math.trunc(precision)))
    : 1;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Keep full dates in metadata and allow wrapping only between date and clock. */
export function cardTimeParts(timestamp: number | null) {
  if (timestamp === null || !Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const iso = date.toISOString();
  return {
    date: iso.slice(0, 10),
    clock: timestamp % 1000 ? iso.slice(11, 23) : iso.slice(11, 19),
    iso,
  };
}

export function valueMatches(definition: CardDefinition, value: CardValue) {
  if (value === null) return false;
  if (definition.type === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (definition.type === "text") return typeof value === "string";
  if (definition.type === "state")
    return definition.states.some((state) => state.value === value);
  return (
    Array.isArray(value) &&
    value.every(
      (row) => row !== null && typeof row === "object" && !Array.isArray(row),
    )
  );
}
