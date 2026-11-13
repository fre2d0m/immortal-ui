import { useEffect, useRef, useState } from "react";
import { Copy, Download, Search, X } from "lucide-react";
import {
  iconCategories,
  iconCounts,
  iconExtension,
  type IoTIconEntry,
} from "@/content/icons";
import { IoTIcon } from "@/components/IoTIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeSnippet, installCommand } from "@/components/CodeSnippet";

const sizes = [16, 20, 24, 32];
const sourceNames = { all: "全部来源", lucide: "Lucide", custom: "SVG 扩展" };
type Source = keyof typeof sourceNames;
const assetUrl = (icon: IoTIconEntry) =>
  `${import.meta.env.BASE_URL}icons/${icon.id}.svg`;

function IconDetail({ icon, size }: { icon: IoTIconEntry; size: number }) {
  const [svg, setSvg] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState("");
  const [copyError, setCopyError] = useState(false);
  const [copied, setCopied] = useState(false);
  const importSource =
    icon.source === "lucide" ? "lucide-react" : iconExtension.importPath;
  const reactCode = `import { ${icon.component} } from "${importSource}";\n\n<${icon.component} size={${size}} strokeWidth={2} aria-label="${icon.label}" />`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(assetUrl(icon), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("SVG unavailable");
        return response.text();
      })
      .then((text) => {
        if (!text.includes("<svg ") || text.includes("<html"))
          throw new Error("Invalid SVG response");
        setSvg(text);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [icon.id]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      setCopyError(false);
      setMessage("SVG 已复制，包含来源说明。");
    } catch {
      setCopyError(true);
      setMessage("无法访问剪贴板，可下载 SVG 文件。");
    }
  }
  return (
    <>
      <DialogHeader>
        <div className="icon-detail-heading">
          <DialogTitle>{icon.label}</DialogTitle>
          <Badge variant="secondary">
            {icon.source === "lucide" ? "Lucide" : "原创 SVG"}
          </Badge>
        </div>
        <DialogDescription>{icon.description}</DialogDescription>
      </DialogHeader>
      <div className="icon-detail-preview surface-inset">
        {sizes.map((value) => (
          <div key={value}>
            <div>
              <IoTIcon
                name={icon.component}
                size={value}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <span>{value} px</span>
          </div>
        ))}
      </div>
      <div className="icon-detail-actions">
        <Button onClick={copy} disabled={!svg}>
          <Copy />
          {copied ? "已复制 SVG" : "复制 SVG"}
        </Button>
        <Button variant="secondary" asChild>
          <a href={assetUrl(icon)} download={`${icon.id}.svg`}>
            <Download />
            下载 SVG
          </a>
        </Button>
      </div>
      {(message || loadError) && (
        <p
          className={
            copyError || loadError ? "text-warning" : "text-muted-foreground"
          }
          role="status"
        >
          {loadError ? "SVG 文件暂时不可用，请关闭后重试。" : message}
        </p>
      )}
      <div className="icon-usage">
        <h3>React 用法</h3>
        <CodeSnippet code={reactCode} label={`${icon.label} React 用法`} />
      </div>
      {icon.source === "custom" ? (
        <div className="icon-usage">
          <h3>安装 SVG 扩展</h3>
          <CodeSnippet
            code={installCommand(iconExtension.name)}
            label="IoT icon extensions installation"
          />
          <p>10 个图标共用 Lucide 的 size、color、strokeWidth 和 SVG 属性。</p>
        </div>
      ) : (
        <p className="icon-source-link">
          <a
            href={`https://lucide.dev/icons/${icon.lucideSlug}`}
            target="_blank"
            rel="noreferrer"
          >
            Lucide / {icon.component}
          </a>
          <span> · </span>
          <a
            href={`${import.meta.env.BASE_URL}icons/lucide-license.txt`}
            target="_blank"
            rel="noreferrer"
          >
            许可证
          </a>
        </p>
      )}
      <p className="icon-detail-note">
        24 × 24 网格 · 2px 线宽 · 圆角端点 · currentColor。SVG 按 24px
        导出；React 用法采用当前预览尺寸。
      </p>
    </>
  );
}

export function IconsPage({ category }: { category?: string }) {
  const selectedGroup = iconCategories.find((group) => group.id === category);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source>("all");
  const [size, setSize] = useState(24);
  const [selectedIcon, setSelectedIcon] = useState<IoTIconEntry | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    setQuery("");
    setSelectedIcon(null);
  }, [category]);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const groups = iconCategories
    .filter((group) => !selectedGroup || group.id === selectedGroup.id)
    .map((group) => ({
      ...group,
      icons: group.icons.filter(
        (icon) =>
          (source === "all" || icon.source === source) &&
          terms.every((term) =>
            `${icon.label} ${icon.component} ${icon.id} ${icon.keywords} ${group.title}`
              .toLowerCase()
              .includes(term),
          ),
      ),
    }))
    .filter((group) => group.icons.length);
  const count = groups.reduce((total, group) => total + group.icons.length, 0);
  return (
    <>
      <div className="page-heading icons-heading">
        <h1>
          {selectedGroup ? selectedGroup.title : "Icons"}
          <Badge variant="secondary">
            {selectedGroup ? selectedGroup.icons.length : iconCounts.total}{" "}
            个图标
          </Badge>
        </h1>
        <p>
          为泛物联网界面挑选的 {iconCounts.lucide} 个 Lucide 图标，与{" "}
          {iconCounts.custom} 个专用 SVG
          扩展。统一轮廓、清楚语义，可直接用于组件和业务场景。
        </p>
      </div>
      <div className="library-toolbar">
        <nav className="library-filters" aria-label="图标分类">
          <a
            data-slot="navigation-link"
            href="#/icons"
            aria-current={!selectedGroup ? "page" : undefined}
          >
            全部分类
          </a>
          {iconCategories.map((group) => (
            <a
              data-slot="navigation-link"
              key={group.id}
              href={`#/icons/category/${group.id}`}
              aria-current={selectedGroup?.id === group.id ? "page" : undefined}
            >
              {group.title}
            </a>
          ))}
        </nav>
      </div>
      <div className="icon-tools">
        <div className="icon-search">
          <Search size={16} aria-hidden="true" />
          <Input
            type="search"
            aria-label="搜索图标"
            placeholder="搜索名称、用途或协议…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="清除图标搜索"
              onClick={() => setQuery("")}
            >
              <X />
            </Button>
          )}
        </div>
        <div className="icon-source-filters" role="group" aria-label="图标来源">
          {(Object.keys(sourceNames) as Source[]).map((value) => (
            <button
              type="button"
              data-slot="filter-chip"
              key={value}
              aria-pressed={source === value}
              onClick={() => setSource(value)}
            >
              {sourceNames[value]}
            </button>
          ))}
        </div>
        <div
          className="icon-size-options"
          role="group"
          aria-label="图标预览尺寸"
        >
          <span>尺寸</span>
          {sizes.map((value) => (
            <button
              type="button"
              data-slot="navigation-link"
              aria-label={`图标预览 ${value}px`}
              key={value}
              aria-pressed={size === value}
              onClick={() => setSize(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="icon-library-meta">
        <p role="status">
          {count} 个图标{query.trim() ? ` · “${query.trim()}”` : ""}
        </p>
        <p>点击查看用法、复制或下载 SVG</p>
      </div>
      {count ? (
        <div className="icon-category-grid">
          {groups.map((group) => (
            <section
              key={group.id}
              className="icon-category surface-raised"
              aria-labelledby={`icons-${group.id}`}
            >
              <div className="icon-category-title">
                <h2 id={`icons-${group.id}`}>{group.title}</h2>
                <span>{group.icons.length}</span>
              </div>
              <p>{group.description}</p>
              <ul className="icon-slot-grid">
                {group.icons.map((icon) => (
                  <li key={icon.id}>
                    <button
                      type="button"
                      className="icon-tile"
                      data-icon-id={icon.id}
                      aria-label={`查看${icon.label}图标`}
                      aria-haspopup="dialog"
                      onClick={(event) => {
                        trigger.current = event.currentTarget;
                        setSelectedIcon(icon);
                      }}
                    >
                      <span className="icon-glyph">
                        <IoTIcon
                          name={icon.component}
                          size={size}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="icon-tile-label">{icon.label}</span>
                      <span className="icon-tile-source">
                        {icon.source === "lucide" ? "Lucide" : "SVG 扩展"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="icon-empty surface-inset">
          <h2>没有匹配的图标</h2>
          <p>试试“温度”“泵”“RS-485”或英文名称。</p>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("");
              setSource("all");
            }}
          >
            清除筛选
          </Button>
        </div>
      )}
      <p className="icon-library-footer">
        基于{" "}
        <a
          href="https://lucide.dev/contribute/icons/specification"
          target="_blank"
          rel="noreferrer"
        >
          Lucide 设计规范
        </a>
        。图标与文字标签配合表达物理量、设备及状态。
      </p>
      <Dialog
        open={!!selectedIcon}
        onOpenChange={(open) => {
          if (!open) setSelectedIcon(null);
        }}
      >
        <DialogContent
          className="icon-detail"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (trigger.current?.isConnected) trigger.current.focus();
          }}
        >
          {selectedIcon && (
            <IconDetail key={selectedIcon.id} icon={selectedIcon} size={size} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
