import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lucide from "lucide-react";
import * as custom from "../registry/immortal/icons/iot-icons.ts";
import { iconCatalog } from "../src/content/icons.ts";

const directory = new URL("../public/icons/", import.meta.url);
await mkdir(directory, { recursive: true });
const license = await readFile(
  new URL("../node_modules/lucide-react/LICENSE", import.meta.url),
  "utf8",
);
for (const icon of iconCatalog) {
  const Component = (icon.source === "lucide" ? lucide : custom)[
    icon.component
  ];
  if (!Component) throw new Error(`Missing icon export: ${icon.component}`);
  const svg = renderToStaticMarkup(
    createElement(Component, {
      size: 24,
      strokeWidth: 2,
      "aria-label": icon.label,
      role: "img",
    }),
  ).replace(/ class="[^"]*"/g, "");
  const attribution =
    icon.source === "lucide"
      ? `Lucide ${icon.lucideSlug}\nhttps://lucide.dev/icons/${icon.lucideSlug}\n\n${license}`
      : `Immortal UI original SVG: ${icon.component}`;
  await writeFile(
    new URL(`${icon.id}.svg`, directory),
    `<!--\n${attribution.replaceAll("--", "—")}\n-->\n${svg}\n`,
  );
}
await writeFile(new URL("lucide-license.txt", directory), license);
await writeFile(
  new URL("catalog.json", directory),
  JSON.stringify(iconCatalog, null, 2) + "\n",
);
console.log(`Built ${iconCatalog.length} SVG icons.`);
