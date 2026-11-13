"use client";
import { useEffect, useRef, useState } from "react";
import {
  applyCommandEvent,
  type CommandAction,
  type CommandRecord,
} from "@/lib/iot-model";
/** Transport completion means accepted, never verified. */
export function useDeviceCommand(timeoutMs = 15000) {
  const [record, setRecord] = useState<CommandRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const current = useRef<{ id: string; controller: AbortController } | null>(
    null,
  );
  useEffect(
    () => () => {
      current.current?.controller.abort();
      current.current = null;
    },
    [],
  );
  async function run<T>(requested: string, value: T, action: CommandAction<T>) {
    if (current.current) return;
    const id = globalThis.crypto.randomUUID();
    const controller = new AbortController();
    current.current = { id, controller };
    const at = Date.now();
    setRecord({
      id,
      requested,
      phase: "sending",
      events: [{ phase: "sending", at }],
    });
    setBusy(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const receipt = await Promise.race([
        action(value, { requestId: id, signal: controller.signal }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(
              new Error(
                "等待回执超时；结果未知，请查询设备状态后再决定是否重试。",
              ),
            );
          }, timeoutMs);
        }),
      ]);
      if (current.current?.id !== id) return;
      setRecord(
        (previous) =>
          previous &&
          applyCommandEvent(previous, id, {
            phase: receipt?.phase ?? "accepted",
            at: Date.now(),
            detail: receipt?.message ?? "请求已接收；以设备回读为准。",
          }),
      );
      return receipt ?? { phase: "accepted" as const };
    } catch (error) {
      if (current.current?.id !== id) return;
      setRecord(
        (previous) =>
          previous &&
          applyCommandEvent(previous, id, {
            phase: controller.signal.aborted ? "timeout" : "failed",
            at: Date.now(),
            detail:
              error instanceof Error
                ? error.message
                : "请求失败，设备回读未改变。",
          }),
      );
    } finally {
      clearTimeout(timer);
      if (current.current?.id === id) {
        current.current = null;
        setBusy(false);
      }
    }
  }
  return { record, busy, run };
}
