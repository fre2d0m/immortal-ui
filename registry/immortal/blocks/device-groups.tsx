"use client";

import { Panel } from "@/components/iot/internal/panel";

import { useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Cpu,
  FolderTree,
  Layers,
} from "lucide-react";

import { DeviceStatus } from "@/components/iot/device-status";

export type GroupMember = {
  id: string;
  name: string;
  product?: string;
  online: boolean | null;
  href?: string;
};
export type DeviceGroup = {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  children?: DeviceGroup[];
};

function groupPath(groups: DeviceGroup[], id: string): DeviceGroup[] {
  for (const group of groups) {
    if (group.id === id) return [group];
    const child = groupPath(group.children ?? [], id);
    if (child.length) return [group, ...child];
  }
  return [];
}

function GroupList({
  groups,
  active,
  expanded,
  onToggle,
  onSelect,
}: {
  groups: DeviceGroup[];
  active: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="min-w-0 space-y-1">
      {groups.map((group) => {
        const open = expanded.has(group.id);
        const hasChildren = !!group.children?.length;
        return (
          <li key={group.id}>
            <div className="flex min-w-0 items-start gap-1">
              {hasChildren && (
                <button
                  type="button"
                  data-slot="navigation-link"
                  className="size-10! shrink-0 justify-center p-0!"
                  aria-label={"子群组：" + group.name}
                  aria-expanded={open}
                  onClick={() => onToggle(group.id)}
                >
                  {open ? (
                    <ChevronDown className="size-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="size-4" aria-hidden="true" />
                  )}
                </button>
              )}
              <button
                type="button"
                data-slot="navigation-link"
                data-active={group.id === active}
                aria-pressed={group.id === active}
                aria-label={
                  group.name + "，直接绑定 " + group.members.length + " 台设备"
                }
                className="min-h-10! min-w-0 flex-1 justify-between text-left"
                onClick={() => onSelect(group.id)}
              >
                <span className="wrap-break-word">{group.name}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {group.members.length}
                </span>
              </button>
            </div>
            {hasChildren && open && (
              <div className="my-1 ml-2 border-l border-border/70 pl-2">
                <GroupList
                  groups={group.children!}
                  active={active}
                  expanded={expanded}
                  onToggle={onToggle}
                  onSelect={onSelect}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function DeviceGroups({
  groups,
  title = "场景与群组",
  initialGroupId,
}: {
  groups: DeviceGroup[];
  title?: string;
  initialGroupId?: string;
}) {
  const initialPath = groupPath(groups, initialGroupId ?? "");
  const [active, setActive] = useState(
    initialPath.at(-1)?.id ?? groups[0]?.id ?? "",
  );
  const [expanded, setExpanded] = useState(
    () =>
      new Set([
        ...groups.map((group) => group.id),
        ...initialPath.slice(0, -1).map((group) => group.id),
      ]),
  );
  const path = groupPath(groups, active);
  const current = path.at(-1) ?? groups[0];

  function toggle(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Panel
      as="h2"
      icon={<FolderTree />}
      title={title}
      className="@container min-w-0"
    >
      {current ? (
        <div className="grid min-w-0 gap-4 @2xl:grid-cols-[minmax(12rem,0.55fr)_minmax(0,1fr)]">
          <nav
            aria-label="设备群组"
            className="surface-inset min-w-0 self-start p-2 @2xl:p-3"
          >
            <div
              aria-hidden="true"
              className="mb-2 flex items-center justify-between gap-2 px-2 pt-1 text-sm text-muted-foreground"
            >
              <span>群组</span>
              <span>直接绑定</span>
            </div>
            <GroupList
              groups={groups}
              active={current.id}
              expanded={expanded}
              onToggle={toggle}
              onSelect={setActive}
            />
          </nav>
          <section
            className="min-w-0 space-y-4"
            aria-label={current.name + "的设备"}
          >
            <div className="min-w-0">
              {path.length > 1 && (
                <p className="mb-1 text-sm wrap-break-word text-muted-foreground">
                  {path
                    .slice(0, -1)
                    .map((group) => group.name)
                    .join(" / ")}
                </p>
              )}
              <h3 className="text-lg font-medium text-balance wrap-break-word">
                {current.name}
              </h3>
              {current.description && (
                <p className="mt-1.5 text-sm wrap-break-word text-muted-foreground">
                  {current.description}
                </p>
              )}
            </div>
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Layers
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              直接绑定{" "}
              <span className="text-muted-foreground tabular-nums">
                {current.members.length} 台设备
              </span>
            </h4>
            {current.members.length ? (
              <ul className="surface-inset divide-y divide-border/60 px-3">
                {current.members.map((member) => {
                  const identity = (
                    <>
                      <Cpu
                        className="hidden size-4 shrink-0 text-muted-foreground @md:block"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium wrap-break-word">
                          {member.name}
                        </span>
                        <span className="mt-0.5 block text-sm wrap-break-word text-muted-foreground">
                          {member.id}
                          {member.product && " · " + member.product}
                        </span>
                      </span>
                      {member.online === null ? (
                        <span className="text-sm text-muted-foreground">
                          未知
                        </span>
                      ) : (
                        <DeviceStatus
                          state={member.online ? "online" : "offline"}
                          label={member.online ? "在线" : "离线"}
                        />
                      )}
                    </>
                  );
                  const rowClass =
                    "flex min-h-12 min-w-0 items-center gap-2 rounded-md px-1 py-2.5";
                  return (
                    <li key={member.id}>
                      {member.href ? (
                        <a
                          href={member.href}
                          className={
                            rowClass +
                            " hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                          }
                        >
                          {identity}
                          <ArrowUpRight
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <div className={rowClass}>{identity}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="surface-inset p-5 text-sm text-muted-foreground">
                该群组暂无直接绑定的设备
              </p>
            )}
          </section>
        </div>
      ) : (
        <p className="surface-inset p-5 text-sm text-muted-foreground">
          暂无设备群组
        </p>
      )}
    </Panel>
  );
}
