import React from "react";
import { ArrowUpRight, SearchX } from "lucide-react";
import { componentCatalog, componentGroups } from "../content/components";
import {
  ImmortalButton,
  ImmortalInput,
  ImmortalTextarea,
  ImmortalSwitch,
  ImmortalCheckbox,
  ImmortalRadioGroup,
  ImmortalSlider,
  ImmortalSelect,
  ImmortalTabs,
  ImmortalBadge,
  ImmortalCard,
} from "../components/ImmortalComponents";

function Thumbnail({ id }: { id: string }) {
  switch (id) {
    case "button":
      return (
        <div className="flex gap-2">
          <ImmortalButton size="sm">Button</ImmortalButton>
          <ImmortalButton variant="metallic" size="sm">
            Primary
          </ImmortalButton>
        </div>
      );
    case "input":
      return <ImmortalInput placeholder="Search your workspace…" kbd="⌘K" />;
    case "textarea":
      return <ImmortalTextarea placeholder="Write a message…" rows={2} />;
    case "switch":
      return (
        <ImmortalSwitch checked onChange={() => {}} label="Notifications" />
      );
    case "checkbox":
      return (
        <ImmortalCheckbox
          checked
          onChange={() => {}}
          label="Remember preferences"
        />
      );
    case "radio-group":
      return (
        <ImmortalRadioGroup
          name="catalog-theme"
          value="dark"
          onChange={() => {}}
          options={[
            { value: "dark", label: "Dark" },
            { value: "metal", label: "Metal" },
          ]}
        />
      );
    case "slider":
      return (
        <ImmortalSlider value={64} onChange={() => {}} label="Intensity" />
      );
    case "select":
      return (
        <ImmortalSelect
          value="team"
          onChange={() => {}}
          options={[{ value: "team", label: "Team workspace" }]}
        />
      );
    case "tabs":
      return (
        <ImmortalTabs
          activeId="overview"
          onChange={() => {}}
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "activity", label: "Activity" },
          ]}
        />
      );
    case "badge":
      return (
        <div className="flex gap-3">
          <ImmortalBadge dotColor="green">Online</ImmortalBadge>
          <ImmortalBadge dotColor="amber">Pending</ImmortalBadge>
        </div>
      );
    case "card":
      return (
        <div className="w-full">
          <ImmortalCard
            title="Your workspace"
            badge={<ImmortalBadge dotColor="green">Ready</ImmortalBadge>}
          >
            <span className="text-xs text-zinc-400">
              A place for your next idea.
            </span>
          </ImmortalCard>
        </div>
      );
    case "modal":
      return <ImmortalButton size="sm">Open dialog</ImmortalButton>;
    default:
      return <ImmortalBadge dotColor="green">Changes saved</ImmortalBadge>;
  }
}

export function ComponentCatalog({ query = "" }: { query?: string }) {
  const items = componentCatalog.filter((c) =>
    `${c.name} ${c.summary} ${c.category}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  return (
    <article className="min-w-0">
      <header className="mb-10">
        <p className="site-eyebrow">THE LIBRARY</p>
        <h1 className="site-page-title mt-4">Components</h1>
        <p className="site-page-description">
          Familiar building blocks. A different kind of depth. Browse{" "}
          {componentCatalog.length} components, then explore their preview,
          code, and API in one place.
        </p>
      </header>
      {query && (
        <p className="mb-6 text-xs text-zinc-400">
          {items.length} results for “{query}”
        </p>
      )}
      {!items.length && (
        <div className="flex gap-3 rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
          <SearchX size={18} />
          <p>No matching components. Try “button”, “form”, or “feedback”.</p>
        </div>
      )}
      {componentGroups.map((group) => {
        const grouped = items.filter((c) => c.category === group);
        if (!grouped.length) return null;
        return (
          <section key={group} className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-sm font-medium text-zinc-200">{group}</h2>
              <span className="font-mono text-[10px] text-zinc-600">
                {grouped.length.toString().padStart(2, "0")}
              </span>
              <div className="h-px flex-1 bg-white/[0.07]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {grouped.map((item) => (
                <a
                  key={item.id}
                  href={`#/components/${item.id}`}
                  className="catalog-card group min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] transition-colors hover:border-white/20"
                >
                  <div
                    inert
                    aria-hidden="true"
                    className="pointer-events-none flex h-[150px] items-center justify-center border-b border-white/[0.06] bg-black/20 px-5"
                  >
                    <div className="w-full max-w-[280px]">
                      <Thumbnail id={item.id} />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {item.name}
                      </h3>
                      <ArrowUpRight
                        size={15}
                        className="text-zinc-600 transition-colors group-hover:text-zinc-300"
                      />
                    </div>
                    <p className="mt-2 text-xs leading-6 text-zinc-500">
                      {item.summary}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </article>
  );
}
