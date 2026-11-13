import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DataWorkflow } from "@/components/blocks/data-workflow";
import { createWorkflowDemo, summarizeWorkflowDemoNode, workflowTemplates, type WorkflowDemoScenario } from "./demo";
import { runWorkflowDemo } from "./runner";
import { applySettings } from "./lib/theme-storage";
import { defaultSettings } from "./lib/theme-settings";
import "./index.css";

const params = new URLSearchParams(location.search);
applySettings({ ...defaultSettings, mode: params.get("mode") === "light" ? "light" : "dark", fontSize: Number(params.get("font") || 14), primary: "#5865d9" });
function initial() {
  const flow = createWorkflowDemo();
  if (params.has("long")) flow.nodes[2].label = "North bank temperature monitoring and cross-year observation review";
  return flow;
}
function App() {
  const [flow, setFlow] = useState(initial);
  const [calls, setCalls] = useState(0);
  const [save, setSave] = useState(true);
  const [run, setRun] = useState(true);
  const issues = (count: number) => setFlow(f => ({ ...f, nodes: f.nodes.map(node => ({ ...node, parameters: node.parameters.map(field => field.key === "sourceRef" && ["water", ...(count > 1 ? ["weather"] : [])].includes(node.id) ? { ...field, value: "" } : field) })) }));
  return <main style={{ padding: 16 }}>
    <DataWorkflow workflow={flow} onChange={setFlow} publication={{ workflowId: flow.id, status: "draft" }} templates={workflowTemplates} getNodeSummary={summarizeWorkflowDemoNode}
      onSave={save ? async () => {} : undefined}
      onRun={run ? (definition, context) => { setCalls(n => n + 1); return runWorkflowDemo(definition, (params.get("scenario") || "normal") as WorkflowDemoScenario, context, { delayMs: 20 }); } : undefined} />
    <fieldset style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
      <legend>Test host controls</legend>
      <button id="one-issue" onClick={() => issues(1)}>One issue</button>
      <button id="two-issues" onClick={() => issues(2)}>Two issues</button>
      <button id="fix" onClick={() => setFlow(initial())}>Reset definition</button>
      <button id="empty" onClick={() => setFlow(f => ({ ...f, name: "New data workflow", nodes: [], edges: [] }))}>Empty workflow</button>
      <label><input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)} />Provide save</label>
      <label><input type="checkbox" checked={run} onChange={e => setRun(e.target.checked)} />Provide run</label>
      <output id="host-run-count">{calls}</output>
    </fieldset>
  </main>;
}
createRoot(document.getElementById("root")!).render(<App />);
