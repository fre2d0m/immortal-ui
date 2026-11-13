import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registrySchema, registryItemSchema } from "shadcn/schema";
import { items } from "../registry/catalog.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const registry = registrySchema.parse(JSON.parse(read("registry.json")));
const names = new Set(registry.items.map((item) => item.name));

test("registry has unique, schema-valid, fully embedded installable items", () => {
  assert.equal(names.size, registry.items.length);
  assert.deepEqual(
    registry.items.map((item) => item.name).sort(),
    items.map((item) => item.name).sort(),
  );
  for (const item of registry.items) {
    const payload = registryItemSchema.parse(
      JSON.parse(read(`public/r/${item.name}.json`)),
    );
    assert.equal(payload.name, item.name);
    for (const file of payload.files ?? []) {
      assert.equal(
        file.content,
        read(file.path),
        `${item.name}: stale embedded source`,
      );
      assert.match(file.target, /^@(components|lib)\//);
      assert.ok(!file.target.includes(".."));
      assert.ok(
        !/@\/lib\/[^"\s]*demo[^"\s]*/.test(file.content),
        "demo fixtures must not ship",
      );
    }
  }
});

test("custom dependencies form a closed acyclic install graph", () => {
  const visited = new Set();
  function visit(name, parents = []) {
    assert.ok(
      !parents.includes(name),
      `dependency cycle: ${[...parents, name]}`,
    );
    if (visited.has(name)) return;
    const item = registry.items.find((entry) => entry.name === name);
    assert.ok(item, `missing item: ${name}`);
    for (const dependency of item.registryDependencies ?? []) {
      assert.ok(
        !dependency.startsWith("immortal:"),
        "internal dependency shorthand leaked",
      );
      if (dependency.startsWith("https://immortal.build/r/"))
        visit(dependency.split("/").at(-1).replace(".json", ""), [
          ...parents,
          name,
        ]);
    }
    visited.add(name);
  }
  for (const name of names) visit(name);
});

test("every custom import is installed by the item's transitive dependency closure", () => {
  const customUi = new Set(
    registry.items
      .flatMap((item) => item.files ?? [])
      .filter((file) => file.target.startsWith("@components/ui/"))
      .map((file) =>
        file.target
          .replace("@components/", "@/components/")
          .replace(/\.(ts|tsx)$/, ""),
      ),
  );
  function installed(item, seen = new Set()) {
    if (seen.has(item.name)) return [];
    seen.add(item.name);
    return [
      ...(item.files ?? []),
      ...(item.registryDependencies ?? []).flatMap((dep) => {
        if (!dep.startsWith("https://immortal.build/r/")) return [];
        return installed(
          registry.items.find((entry) => dep.endsWith(`/${entry.name}.json`)),
          seen,
        );
      }),
    ];
  }
  for (const item of registry.items) {
    const files = installed(item);
    const paths = new Set(
      files.map((file) =>
        file.target
          .replace(/^@(components|lib)/, "@/$1")
          .replace(/\.(ts|tsx)$/, ""),
      ),
    );
    for (const file of item.files ?? []) {
      for (const match of read(file.path).matchAll(
        /from ["'](@\/(?:components\/(?:iot|blocks|ui)|lib)\/[^"']+)["']/g,
      )) {
        if (match[1].startsWith("@/components/ui/") && !customUi.has(match[1]))
          continue;
        assert.ok(
          paths.has(match[1]),
          `${item.name}: uninstalled import ${match[1]}`,
        );
      }
    }
  }
});

test("every Block declares the shadcn primitives imported by its source", () => {
  for (const item of registry.items.filter(
    (entry) => entry.type === "registry:block",
  )) {
    for (const file of item.files ?? []) {
      for (const [, name] of read(file.path).matchAll(
        /from ["']@\/components\/ui\/([^"']+)["']/g,
      )) {
        assert.ok(
          item.registryDependencies.some(
            (dependency) =>
              dependency === name ||
              dependency === `https://immortal.build/r/${name}.json`,
          ),
          `${item.name}: missing UI dependency ${name}`,
        );
      }
    }
  }
});

test("Graphite ships both modes, state rules and accessibility fallbacks", () => {
  const theme = registry.items.find((item) => item.name === "graphite");
  assert.equal(theme.type, "registry:style");
  assert.equal(theme.cssVars.light.background, "#e9e9e7");
  assert.equal(theme.cssVars.dark.background, "#0c0c0c");
  assert.equal(theme.cssVars.dark.primary, "#dededc");
  assert.equal(theme.cssVars.light.primary, "#303030");
  for (const mode of ["light", "dark"]) {
    for (const [token, value] of Object.entries({
      "font-size-base": "14px",
      "body-font-size": "14px",
      "control-height": "34px",
      "card-padding": "24px",
      "button-radius": "6px",
      "surface-radius": "12px",
      "nav-radius": "12px",
      "content-width": "1440px",
      "tab-radius": "18px",
      "tab-padding-x": "14px",
      "tab-padding-y": "4px",
      "tab-list-padding": "4px",
      "tag-font-size": "12px",
      "lab-sidebar-width": "268px",
    }))
      assert.equal(theme.cssVars[mode][token], value, `${mode}: ${token}`);
  }
  assert.equal(
    read("public/themes/graphite.css"),
    read("registry/immortal/styles/graphite.css"),
  );
  for (const [token, value] of Object.entries({
    "text-xs": "var(--support-font-size)",
    "text-sm": "var(--support-font-size)",
    "text-base": "var(--body-font-size)",
    "text-xs--line-height": "calc(var(--support-font-size) * 10 / 7)",
    "text-sm--line-height": "calc(var(--support-font-size) * 10 / 7)",
    "text-base--line-height": "calc(var(--body-font-size) * 1.5)",
  }))
    assert.equal(theme.cssVars.theme[token], value, token);
  const css = JSON.stringify(theme.css);
  for (const token of [
    "data-slot",
    "prefers-reduced-motion",
    "forced-colors",
    "focus-visible",
    "aria-invalid",
  ])
    assert.ok(css.includes(token), `missing ${token}`);
  assert.ok(!css.includes("transition: all"));
  assert.ok(theme.css['@import "tw-animate-css"']);
  assert.ok(theme.css['@import "shadcn/tailwind.css"']);
  const checkRules = (rules) => {
    for (const [selector, body] of Object.entries(rules)) {
      if (selector.startsWith("@")) {
        checkRules(body);
        continue;
      }
      assert.ok(
        !selector.trim().startsWith(">"),
        `unresolved relative selector: ${selector}`,
      );
      assert.ok(!selector.includes("&"), `unresolved nesting: ${selector}`);
      for (const [property, value] of Object.entries(body)) {
        assert.ok(
          typeof value === "string" || property.startsWith("@apply"),
          `nested CSS passed to the installer: ${selector} / ${property}`,
        );
      }
    }
  };
  checkRules(theme.css);
});

test("Graphite keeps hover, press and persistent selection separate in the installable theme", () => {
  const theme = registry.items.find((item) => item.name === "graphite");
  const hoverRules = Object.entries(theme.css["@media (hover: hover)"]);
  const interactionRoles = [
    {
      slot: '[data-variant="ghost"]',
      selection: ['[aria-pressed="true"]', '[aria-expanded="true"]'],
      hoverShadow: "var(--shadow-hover)",
      press: "var(--pressed-background)",
    },
    {
      slot: '[data-slot="tabs-trigger"]',
      selection: ['[aria-selected="true"]'],
      hoverShadow: "none",
      hoverFill: "transparent",
      press: "color-mix(in srgb, var(--foreground) 8%, transparent)",
    },
    {
      slot: '[data-slot="filter-chip"]',
      selection: ['[aria-pressed="true"]', '[aria-current="page"]'],
      hoverShadow: "none",
      hoverFill: "color-mix(in srgb, var(--foreground) 5%, transparent)",
      press: "color-mix(in srgb, var(--foreground) 8%, transparent)",
    },
  ];

  for (const {
    slot,
    selection,
    hoverShadow,
    hoverFill,
    press,
  } of interactionRoles) {
    const hover = hoverRules.find(
      ([selector, rule]) =>
        selector.includes(slot) && rule["box-shadow"] === hoverShadow,
    );
    assert.ok(hover, slot + " has a flat hover rule");
    if (hoverFill) assert.equal(hover[1].background, hoverFill);
    const excluded = hover[0].match(/:not\(([^)]+)\):hover/)?.[1] ?? "";
    for (const state of [":disabled", ":active", ...selection]) {
      assert.ok(
        excluded.includes(state),
        slot + " excludes " + state + " from hover",
      );
    }
    assert.ok(
      Object.entries(theme.css).some(
        ([selector, rule]) =>
          selector.includes(slot) &&
          selector.endsWith(":active") &&
          rule.background === press,
      ),
      slot + " has a separate press fill",
    );
  }

  for (const mode of ["light", "dark"]) {
    const vars = theme.cssVars[mode];
    assert.notEqual(vars["hover-top"], vars["control-top"]);
    assert.notEqual(vars["hover-bottom"], vars["control-bottom"]);
    assert.match(vars["shadow-hover"], /^inset [^,]+$/);
    assert.match(vars["pressed-background"], /var\(--hover-top\) 96%/);
    assert.match(
      vars["control-pressed-background"],
      /var\(--control-top\) 96%/,
    );
    assert.ok(!vars["pressed-background"].includes("--well-"));
  }
});

test("Graphite exports configurable radii for all Tab variants and slider parts", () => {
  const { css } = registry.items.find((item) => item.name === "graphite");
  assert.equal(
    css['[data-slot="tabs-trigger"]']["border-radius"],
    "var(--tab-radius)",
  );
  for (const part of ["track", "thumb"]) {
    assert.equal(
      css[`[data-slot="slider-${part}"]`]["border-radius"],
      "var(--pill-radius)",
    );
  }
  assert.equal(css['[data-slot="slider-range"]']["border-radius"], "inherit");
});

test("Graphite reserves dropdown elevation for the floating panels", () => {
  const { css } = registry.items.find((item) => item.name === "graphite");
  const rules = Object.entries(css);
  const panels = [
    "dropdown-menu-content",
    "dropdown-menu-sub-content",
    "select-content",
  ];
  const shell = rules.find(([selector]) =>
    panels.every((slot) => selector.includes(`[data-slot="${slot}"]`)),
  );
  assert.equal(shell?.[1]["box-shadow"], "var(--shadow-menu)");

  const rows = rules.filter(([selector]) =>
    selector.includes('[data-slot="dropdown-menu-checkbox-item"]'),
  );
  assert.ok(
    rows.some(
      ([selector, rule]) =>
        selector.includes('[data-state="checked"]') &&
        rule.background ===
          "color-mix(in srgb, var(--accent) 45%, transparent)",
    ),
  );
  assert.ok(
    rows.some(
      ([selector, rule]) =>
        selector.endsWith(":active") &&
        rule["box-shadow"] === "var(--shadow-press-soft)",
    ),
  );
  for (const [, rule] of rows) {
    if (rule["box-shadow"]) {
      assert.ok(
        ["none", "var(--shadow-press-soft)"].includes(rule["box-shadow"]),
      );
    }
  }
});
