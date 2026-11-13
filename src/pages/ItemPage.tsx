import { lazy, Suspense, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeSnippet, installCommand } from "@/components/CodeSnippet";
import { Badge } from "@/components/ui/badge";
import {
  RegistryPreview,
  FoundationsPreview,
} from "@/components/RegistryPreview";
import {
  catalog,
  componentGroups,
  blockGroups,
  itemHref,
  type CatalogItem,
} from "@/content/catalog";
import { CatalogVisual } from "@/components/CatalogVisual";

const BlockPreview = lazy(() =>
  import("@/components/BlockPreview").then((module) => ({
    default: module.BlockPreview,
  })),
);

function BlockItemPage({
  item,
  search,
}: {
  item: CatalogItem;
  search?: string;
}) {
  const installation = useRef<HTMLHeadingElement>(null);
  const group = blockGroups.find((entry) => entry.id === item.group);
  const planned = item.status === "planned";

  return (
    <div className="block-item" lang="zh-CN">
      <nav aria-label="当前位置" className="item-breadcrumb">
        <a href="#/blocks" lang="en">
          Blocks
        </a>
        <span aria-hidden="true">/</span>
        <a href={"#/blocks/category/" + item.group}>{group?.title}</a>
      </nav>
      <header className="page-heading block-item-heading">
        <div className="block-item-title">
          <h1>{item.caption}</h1>
          <p className="block-item-name" lang="en">
            {item.title}
          </p>
        </div>
        <p className="block-item-description">{item.description}</p>
        <div className="block-item-action">
          {planned ? (
            <Badge variant="outline">场景规划</Badge>
          ) : (
            <Button
              variant="ghost"
              className="min-h-10"
              onClick={() => {
                installation.current?.focus({ preventScroll: true });
                installation.current?.scrollIntoView({ block: "start" });
              }}
            >
              安装与用法 <ArrowDown aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>
      {planned ? (
        <section className="scenario-plan" aria-label="界面规划">
          <div className="scenario-plan-stage">
            <CatalogVisual item={item} />
          </div>
          <div>
            <h2>界面结构</h2>
            <ul className="scenario-plan-list">
              {item.outline?.map((section) => {
                const [title, detail] = section.split(" · ");
                return (
                  <li key={section}>
                    <h3>{title}</h3>
                    {detail && <p>{detail}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : (
        <>
          <Suspense
            fallback={
              <p role="status" className="doc-copy">
                正在加载场景…
              </p>
            }
          >
            <BlockPreview
              key={item.name + (search ?? "")}
              name={item.name}
              search={search}
            />
          </Suspense>
          <section className="block-install">
            <div className="block-install-heading">
              <h2 ref={installation} tabIndex={-1}>
                安装与用法
              </h2>
              <a
                href={"./r/" + item.name + ".json"}
                target="_blank"
                rel="noreferrer"
                className="registry-json-link"
              >
                Registry JSON
              </a>
            </div>
            <CodeSnippet code={installCommand(item.name)} label="安装命令" />
            <p className="doc-copy">
              依赖会自动安装。材质可选用 <a href="#/theme">Graphite 主题</a>{" "}
              或项目已有的 shadcn/ui 主题。
            </p>
            <h3>用法</h3>
            <CodeSnippet code={item.code} label="用法示例" />
            <h3>接口</h3>
            <ul className="prop-list">
              {item.props.map((prop) => (
                <li key={prop}>{prop}</li>
              ))}
            </ul>
          </section>
        </>
      )}
      {!!item.components?.length && (
        <section className="block-composition">
          <h2>{planned ? "可用基础组件" : "组合使用的组件"}</h2>
          <div className="composition-links">
            {item.components.map((name) => {
              const component = catalog.find((entry) => entry.name === name);
              return (
                component && (
                  <a
                    data-slot="navigation-link"
                    key={name}
                    href={itemHref(component)}
                  >
                    {component.caption}
                  </a>
                )
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export function ItemPage({
  name,
  kind,
  search,
}: {
  name: string;
  kind: "component" | "block";
  search?: string;
}) {
  if (name === "button" && kind === "component")
    return (
      <>
        <div className="page-heading">
          <h1>Foundations</h1>
          <p>
            从面板、凹陷区域和按钮出发，延伸到导航、菜单、选择器和标签。体验同一套材质与交互状态。
          </p>
        </div>
        <div className="preview-shell">
          <div className="preview-label">
            <span>Foundation preview</span>
            <span>Graphite Instrument</span>
          </div>
          <div className="p-6 sm:p-8">
            <FoundationsPreview />
          </div>
        </div>
        <h2 className="doc-heading">Install the foundation</h2>
        <CodeSnippet code="npx shadcn@latest add button input switch checkbox select dropdown-menu badge" />
        <div className="mt-4">
          <CodeSnippet code={installCommand("tabs")} />
        </div>
        <div className="mt-4">
          <CodeSnippet code={installCommand("graphite")} />
        </div>
        <p className="doc-copy">
          The theme targets current shadcn data-slot and data-variant
          attributes. This site uses the Radix Nova style. Install the theme
          once; its tokens apply to all matching primitives.
        </p>
      </>
    );
  const item = catalog.find(
    (entry) => entry.name === name && entry.kind === kind,
  );
  if (!item)
    return (
      <div className="page-heading">
        <h1>未找到{kind === "block" ? "场景" : "组件"}</h1>
        <a
          className="text-sm underline"
          href={kind === "block" ? "#/blocks" : "#/components"}
        >
          {kind === "block" ? "返回 Blocks" : "浏览组件"}
        </a>
      </div>
    );
  if (item.kind === "block")
    return <BlockItemPage item={item} search={search} />;

  const group = componentGroups.find((entry) => entry.id === item.group);
  return (
    <>
      <nav aria-label="Breadcrumb" className="item-breadcrumb">
        <a href="#/components">Components</a>
        <span aria-hidden="true">/</span>
        <a href={"#/components/category/" + item.group}>{group?.title}</a>
        <span aria-hidden="true">/</span>
        <span>{item.title}</span>
      </nav>
      <div className="page-heading">
        <h1>
          {item.title}
          <span className="item-heading-caption">{item.caption}</span>
        </h1>
        <p>{item.description}</p>
        {item.states.length > 0 && (
          <div className="item-states">
            {item.states.map((state) => (
              <Badge variant="outline" key={state}>
                {state}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="preview-shell">
        <div className="preview-label">
          <span>Interactive preview</span>
          <span>演示数据 · 仅本地交互</span>
        </div>
        <div className="p-4 sm:p-7">
          <RegistryPreview key={item.name} name={item.name} />
        </div>
      </div>
      <h2 className="doc-heading">Installation</h2>
      <CodeSnippet
        code={installCommand(item.name)}
        label={item.title + " installation"}
      />
      <p className="doc-copy">
        组件依赖会自动安装。可搭配 <a href="#/theme">Graphite 主题</a>{" "}
        使用，或沿用项目已有的 shadcn/ui 主题。
      </p>
      <h2 className="doc-heading">Usage</h2>
      <CodeSnippet code={item.code} label="usage example" />
      <h2 className="doc-heading">Interface</h2>
      <ul className="prop-list">
        {item.props.map((prop) => (
          <li key={prop}>{prop}</li>
        ))}
      </ul>
      <a
        className="registry-json-link"
        href={"./r/" + item.name + ".json"}
        target="_blank"
        rel="noreferrer"
      >
        View registry JSON
      </a>
    </>
  );
}
