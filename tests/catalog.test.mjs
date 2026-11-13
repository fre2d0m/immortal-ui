import test from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  componentGroups,
  blockGroups,
  itemHref,
} from "../src/content/catalog.ts";
import { items } from "../registry/catalog.mjs";
import { iconCatalog, iconExtension } from "../src/content/icons.ts";

test("every navigable entry belongs to its type's group and has a unique route", () => {
  assert.equal(new Set(catalog.map(itemHref)).size, catalog.length);
  for (const item of catalog) {
    const groups = item.kind === "component" ? componentGroups : blockGroups;
    assert.ok(
      groups.some((group) => group.id === item.group),
      item.name,
    );
    assert.ok(item.caption && item.description, item.name);
  }
  for (const group of [...componentGroups, ...blockGroups]) {
    assert.ok(
      catalog.some((item) => item.group === group.id),
      `empty navigation group ${group.id}`,
    );
  }
});

test("ready entries are installable, planned scenarios never advertise a nonexistent package", () => {
  for (const item of catalog) {
    const installed = items.find((entry) => entry.name === item.name);
    if (item.status === "planned") {
      assert.equal(installed, undefined, item.name);
      assert.equal(item.kind, "block");
      assert.equal(item.code, "");
      assert.ok(item.outline?.length && item.components?.length, item.name);
    } else {
      assert.equal(installed?.type, `registry:${item.kind}`, item.name);
      assert.ok(installed.categories.includes(item.group), item.name);
      assert.ok(item.code && item.props.length, item.name);
    }
  }
  for (const item of items.filter((item) =>
    ["registry:block", "registry:component"].includes(item.type),
  )) {
    if (item.meta?.internal) {
      assert.ok(item.meta.replacement);
      assert.ok(!catalog.some((entry) => entry.name === item.name));
      continue;
    }
    if (item.name === iconExtension.name) {
      assert.ok(item.categories.includes("icons"));
      assert.equal(iconExtension.href, "#/icons");
      assert.ok(
        iconCatalog.some(
          (icon) =>
            icon.source === "custom" && icon.component && icon.description,
        ),
      );
      assert.ok(
        item.files.some(
          (file) =>
            file.target
              .replace(/^@components/, "@/components")
              .replace(/\.ts$/, "") === iconExtension.importPath,
        ),
      );
      continue;
    }
    assert.ok(
      catalog.some((entry) => entry.name === item.name && !entry.status),
      `missing documentation: ${item.name}`,
    );
  }
});

test("scenario compositions link only to real independent components", () => {
  for (const item of catalog.filter((item) => item.kind === "block")) {
    for (const name of item.components) {
      assert.ok(
        catalog.some(
          (entry) =>
            entry.name === name && entry.kind === "component" && !entry.status,
        ),
        `${item.name}: ${name}`,
      );
    }
  }
});
