import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registrySchema, registryItemSchema } from "shadcn/schema";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const registry = registrySchema.parse(JSON.parse(read("registry.json")));
const names = new Set(registry.items.map((item) => item.name));

test("registry has unique, schema-valid, fully embedded installable items", () => {
  assert.equal(names.size, registry.items.length);
  assert.equal(registry.items.length, 11);
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
        !file.content.includes("@/lib/demo-data"),
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
        /from ["'](@\/(?:components\/(?:iot|blocks)|lib)\/[^"']+)["']/g,
      ))
        assert.ok(
          paths.has(match[1]),
          `${item.name}: uninstalled import ${match[1]}`,
        );
    }
  }
});

test("Graphite ships both modes, state rules and accessibility fallbacks", () => {
  const theme = registry.items.find((item) => item.name === "graphite");
  assert.equal(theme.type, "registry:style");
  assert.equal(theme.cssVars.light.background, "#e9e9e7");
  assert.equal(theme.cssVars.dark.background, "#0c0c0c");
  assert.equal(theme.cssVars.light["surface-radius"], "22.4px");
  assert.equal(theme.cssVars.dark.primary, "#dededc");
  assert.equal(theme.cssVars.light.primary, "#303030");
  for (const mode of ["light", "dark"]) {
    for (const [token, value] of Object.entries({
      "font-size-base": "14px",
      "control-height": "32px",
      "card-padding": "24px",
      "button-radius": "8px",
      "content-width": "1440px",
      "tab-radius": "15px",
      "tab-padding-x": "14px",
      "tab-padding-y": "5px",
    })) assert.equal(theme.cssVars[mode][token], value, `${mode}: ${token}`);
  }
  assert.equal(read("public/themes/graphite.css"), read("registry/immortal/styles/graphite.css"));
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
