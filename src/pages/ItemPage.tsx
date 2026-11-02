import { CodeSnippet, installCommand } from "@/components/CodeSnippet";
import {
  RegistryPreview,
  FoundationsPreview,
} from "@/components/RegistryPreview";
import { catalog } from "@/content/catalog";

export function ItemPage({ name }: { name: string }) {
  if (name === "button")
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">Foundation / shadcn/ui</p>
          <h1>
            Familiar primitives.
            <br />A different feel.
          </h1>
          <p>
            Official shadcn/ui components, styled through semantic tokens and
            data-slot selectors. Their behavior and composition remain familiar.
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
        <CodeSnippet code="npx shadcn@latest add button input switch checkbox tabs" />
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
  const item = catalog.find((entry) => entry.name === name);
  if (!item)
    return (
      <div className="page-heading">
        <h1>Item not found</h1>
        <p>This item is not part of the registry.</p>
        <a className="text-sm underline" href="#/components">
          Browse components
        </a>
      </div>
    );
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">
          {item.kind === "block" ? "IoT Blocks" : "IoT components"} /{" "}
          {item.title}
        </p>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
      </div>
      <div className="preview-shell">
        <div className="preview-label">
          <span>Interactive preview</span>
          <span>Demo data · local only</span>
        </div>
        <div className="p-4 sm:p-7">
          <RegistryPreview key={item.name} name={item.name} />
        </div>
      </div>
      <h2 className="doc-heading">Installation</h2>
      <CodeSnippet
        code={installCommand(item.name)}
        label={`${item.title} installation`}
      />
      <p className="doc-copy">
        Install the <a href="#/theme">Graphite theme</a> once for the material
        treatment. Component dependencies are installed automatically; the theme
        is an explicit choice for your project.
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
        href={`./r/${item.name}.json`}
        target="_blank"
        rel="noreferrer"
      >
        View registry JSON
      </a>
    </>
  );
}
