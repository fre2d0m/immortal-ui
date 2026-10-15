import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "./ImmortalToast";

export function CodeBlock({
  code,
  label = "React / TSX",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        title: "Copy unavailable",
        description: "Select the code and copy it manually.",
        type: "info",
      });
    }
  }
  return (
    <div className="immortal-container min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#08080a]">
      <div className="immortal-container flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2 text-[11px] text-zinc-500">
        <span className="font-mono">{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label} code`}
          className="flex min-h-10 items-center gap-1.5 px-2 text-zinc-400 transition-colors hover:text-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[440px] overflow-auto p-5 text-xs leading-7 text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
