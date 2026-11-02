import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import postcss from "postcss";
import postcssNesting from "postcss-nesting";
import { registrySchema } from "shadcn/schema";
import { items } from "../registry/catalog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const production = "https://immortal.build";
const base =
  process.env.REGISTRY_BASE_URL ||
  (process.argv.includes("--local") ? "http://127.0.0.1:4177" : production);
const css = await readFile(
  resolve(root, "registry/immortal/styles/graphite.css"),
  "utf8",
);

// Keep the pasted CSS as the source of truth; generate the CLI's declarative CSS payload.
function merge(target, key, value) {
  if (
    typeof value === "object" &&
    target[key] &&
    typeof target[key] === "object"
  ) {
    for (const [child, entry] of Object.entries(value))
      merge(target[key], child, entry);
  } else target[key] = value;
}
function serialize(nodes = []) {
  const output = {};
  for (const node of nodes) {
    if (node.type === "decl")
      output[node.prop] = node.value + (node.important ? " !important" : "");
    if (node.type === "rule")
      merge(output, node.selector, serialize(node.nodes));
    if (node.type === "atrule")
      merge(
        output,
        `@${node.name}${node.params ? ` ${node.params}` : ""}`,
        serialize(node.nodes),
      );
  }
  return output;
}
// shadcn's CSS updater supports top-level conditional rules, but does not
// preserve native nested media/relative selectors inside a selector object.
// Flatten standard CSS nesting before serializing to retain its semantics.
const ast = (
  await postcss([postcssNesting()]).process(css, { from: undefined })
).root;
const vars = { theme: {}, light: {}, dark: {} };
const rest = [];
for (const node of ast.nodes) {
  if (node.type === "atrule" && node.name === "custom-variant") continue;
  if (
    node.type === "atrule" &&
    node.name === "import" &&
    node.params.includes('"tailwindcss"')
  )
    continue;
  const selector = node.type === "rule" ? node.selector.replace(/\s/g, "") : "";
  const modes =
    node.type === "atrule" && node.name === "theme"
      ? ["theme"]
      : selector === ":root,.dark"
        ? ["light", "dark"]
        : [":root", ":root:not(.dark)"].includes(selector)
          ? ["light"]
          : selector === ".dark"
            ? ["dark"]
            : [];
  if (modes.length) {
    const other = [];
    for (const child of node.nodes) {
      if (child.type === "decl" && child.prop.startsWith("--")) {
        for (const mode of modes) vars[mode][child.prop.slice(2)] = child.value;
      } else if (child.type !== "comment") other.push(child);
    }
    if (other.length) {
      const clone = node.clone();
      clone.removeAll();
      for (const child of other) clone.append(child.clone());
      rest.push(clone);
    }
  } else rest.push(node);
}
const style = { cssVars: vars, css: serialize(rest) };
const compiled = items.map((item) => ({
  ...item,
  // Current style-based upstream primitives inherit these from `shadcn init`.
  // Declare them here too so adding our item never relies on hidden host packages.
  dependencies: [
    ...new Set([
      ...(item.dependencies ?? []),
      ...(item.registryDependencies?.some(
        (dependency) => !dependency.startsWith("immortal:"),
      )
        ? ["radix-ui@^1.8.1", "class-variance-authority@^0.7.1"]
        : []),
    ]),
  ],
  ...(item.name === "graphite" ? style : {}),
  registryDependencies: item.registryDependencies?.map((dependency) =>
    dependency.startsWith("immortal:")
      ? `${production}/r/${dependency.slice(9)}.json`
      : dependency,
  ),
}));
const registry = registrySchema.parse({
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "immortal-ui",
  homepage: production,
  items: compiled,
});
await writeFile(
  resolve(root, "registry.json"),
  JSON.stringify(registry, null, 2) + "\n",
);
execFileSync(
  process.execPath,
  [resolve(root, "node_modules/shadcn/dist/index.js"), "build"],
  { cwd: root, stdio: "inherit" },
);
// The same install graph can be verified locally without requesting unpublished production URLs.
if (base !== production) {
  for (const name of await readdir(resolve(root, "public/r"))) {
    if (!name.endsWith(".json")) continue;
    const path = resolve(root, "public/r", name);
    const content = await readFile(path, "utf8");
    await writeFile(
      path,
      content.replaceAll(`${production}/r/`, `${base.replace(/\/$/, "")}/r/`),
    );
  }
}
await mkdir(resolve(root, "public/themes"), { recursive: true });
await writeFile(resolve(root, "public/themes/graphite.css"), css);
console.log(
  `Built ${compiled.length} registry items. Dependency origin: ${base}`,
);
