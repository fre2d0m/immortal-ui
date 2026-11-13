import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ArrowRight, Search, Layers3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  catalog,
  componentGroups,
  blockGroups,
  itemHref,
} from "@/content/catalog";
import { CatalogVisual } from "@/components/CatalogVisual";

export function CatalogPage({
  kind,
  category,
}: {
  kind: "component" | "block";
  category?: string;
}) {
  const [query, setQuery] = useState("");
  const blocks = kind === "block";
  const root = blocks ? "/blocks" : "/components";
  const groups = blocks ? blockGroups : componentGroups;
  const selected = groups.find((group) => group.id === category);
  const all = catalog.filter((item) => item.kind === kind);
  const items = all.filter(
    (item) =>
      (!selected || item.group === selected.id) &&
      `${item.title} ${item.caption} ${item.description} ${item.name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <div
      className={blocks ? "blocks-library" : undefined}
      lang={blocks ? "zh-CN" : undefined}
    >
      <div className="library-heading">
        <div className="page-heading">
          <h1>
            {selected ? selected.title : blocks ? "Blocks" : "Components"}
            {!blocks && (
              <Badge variant="outline" className="heading-count">
                {selected
                  ? all.filter((item) => item.group === selected.id).length
                  : all.length}
              </Badge>
            )}
          </h1>
          <p>
            {selected
              ? selected.description
              : blocks
                ? "设备巡检、数据观测和现场控制的交互案例。共有 " +
                  all.filter((item) => !item.status).length +
                  " 个可安装场景。"
                : "从感知到行动，为连接物理世界的产品构建界面。按界面类型浏览，每个组件都可独立使用。"}
          </p>
        </div>
        <a
          className="library-crosslink"
          href={blocks ? "#/components" : "#/blocks"}
        >
          {blocks ? "浏览基础组件" : "探索业务场景"}
        </a>
      </div>
      <div className="library-toolbar">
        <nav
          className="library-filters"
          aria-label={blocks ? "场景分组" : "组件分组"}
        >
          <a
            data-slot="navigation-link"
            href={`#${root}`}
            aria-current={!selected ? "page" : undefined}
          >
            全部{!blocks && <span>{all.length}</span>}
          </a>
          {groups.map((group) => (
            <a
              data-slot="navigation-link"
              key={group.id}
              href={`#${root}/category/${group.id}`}
              aria-current={selected?.id === group.id ? "page" : undefined}
            >
              {group.title}
              {!blocks && (
                <span>
                  {all.filter((item) => item.group === group.id).length}
                </span>
              )}
            </a>
          ))}
        </nav>
        <div className="library-search">
          <Search aria-hidden="true" className="size-4" />
          <Input
            type={blocks ? "search" : undefined}
            aria-label={blocks ? "搜索场景" : "搜索组件"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={blocks ? "搜索场景…" : "搜索组件…"}
          />
        </div>
      </div>
      {blocks && query.trim() && (
        <p role="status" className="block-search-result">
          找到 {items.length} 个场景
        </p>
      )}
      {groups
        .filter((group) => !selected || selected.id === group.id)
        .map((group) => {
          const entries = items.filter((item) => item.group === group.id);
          return entries.length ? (
            <section
              key={group.id}
              className="catalog-section"
              aria-labelledby={
                blocks && selected ? undefined : "group-" + group.id
              }
              aria-label={blocks && selected ? group.title : undefined}
            >
              {(!blocks || !selected) && (
                <div className="catalog-section-heading">
                  <div>
                    <h2 id={"group-" + group.id}>
                      {group.title}
                      {!blocks && <span>{group.english}</span>}
                    </h2>
                    <p>{group.description}</p>
                  </div>
                  {!blocks && (
                    <span className="section-count">{entries.length}</span>
                  )}
                </div>
              )}
              <div
                className={blocks ? "catalog-grid blocks-grid" : "catalog-grid"}
              >
                {entries.map((item) => (
                  <a
                    key={item.name}
                    href={itemHref(item)}
                    className={`catalog-tile ${item.status === "planned" ? "planned-tile" : ""}`}
                  >
                    <div className="catalog-art">
                      <CatalogVisual item={item} />
                    </div>
                    <div className="catalog-text">
                      <div className="catalog-title-row">
                        <h3>{blocks ? item.caption : item.title}</h3>
                        {item.firstBatch && (
                          <Badge variant="outline">首批完整组件</Badge>
                        )}
                        {item.status === "planned" ? (
                          <Badge variant="outline">场景规划</Badge>
                        ) : blocks ? (
                          <ArrowRight
                            className="block-tile-arrow size-4"
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                      <p
                        className="catalog-caption"
                        lang={blocks ? "en" : undefined}
                      >
                        {blocks ? item.title : item.caption}
                      </p>
                      <p>{item.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null;
        })}
      {!items.length && (
        <div className="catalog-empty">
          <Search className="size-6" />
          <h2>没有找到匹配的{blocks ? "场景" : "组件"}</h2>
          <p>
            {blocks
              ? "试试“设备”“含水率”或场景的英文名称。"
              : "试试“温度”“告警”或组件的英文名称。"}
          </p>
          <button type="button" onClick={() => setQuery("")}>
            清除搜索
          </button>
        </div>
      )}
      {!blocks && (
        <a href="#/blocks" className="library-bottom-link">
          <Layers3 className="size-5" />
          <div>
            <strong>组件准备好了，开始组合场景。</strong>
            <p>探索温室控制、设备巡检与更多业务界面。</p>
          </div>
        </a>
      )}
    </div>
  );
}
