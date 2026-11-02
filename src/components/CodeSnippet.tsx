import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CodeSnippet({
  code,
  label = "Command",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setFailed(true);
    }
  }
  return (
    <div className="code-snippet surface-inset">
      <div className="flex min-w-0 items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto text-xs leading-relaxed whitespace-pre">
          {code}
        </code>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={copy}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
      <span className="sr-only" role="status">
        {copied ? "Copied to clipboard" : ""}
      </span>
      {failed && (
        <p className="mt-2 text-xs text-warning">
          Clipboard unavailable. Select and copy the command above.
        </p>
      )}
    </div>
  );
}

export function installCommand(name: string) {
  return `npx shadcn@latest add ${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}/r/${name}.json`;
}
