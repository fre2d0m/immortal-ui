import { useState } from "react";
import { createRoot } from "react-dom/client";
import { workflowSignature, type WorkflowPublication } from "@/components/blocks/workflow-model";
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
  const [publication, setPublication] = useState<WorkflowPublication | undefined>({ workflowId: flow.id, status: "draft" });
  const [calls, setCalls] = useState(0);
  const [save, setSave] = useState(true);
  const [run, setRun] = useState(true);
  const issues = (count: number) => setFlow(f => ({ ...f, nodes: f.nodes.map(node => ({ ...node, parameters: node.parameters.map(field => field.key === "sourceRef" && ["water", ...(count > 1 ? ["weather"] : [])].includes(node.id) ? { ...field, value: "" } : field) })) }));
  return <main style={{ padding: 16 }}>
    <DataWorkflow workflow={flow} onChange={setFlow} publication={publication} templates={workflowTemplates} getNodeSummary={summarizeWorkflowDemoNode}
      onSave={save ? async () => {} : undefined}
      onRun={run ? (definition, context) => { setCalls(n => n + 1); return runWorkflowDemo(definition, (params.get("scenario") || "normal") as WorkflowDemoScenario, context, { delayMs: 20 }); } : undefined} />
    <fieldset style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
      <legend>Test host controls</legend>
      <button id="publish" onClick={() => setPublication({ workflowId: flow.id, status: "published", definitionSignature: workflowSignature(flow) })}>Publish</button>
      <button id="draft" onClick={() => setPublication({ workflowId: flow.id, status: "draft" })}>Draft</button>
      <button id="unknown" onClick={() => setPublication(undefined)}>Unknown</button>
      <button id="edit" onClick={() => setFlow(f => ({ ...f, description: f.description + " updated" }))}>Edit definition</button>
      <button id="single" onClick={() => setFlow(f => ({ ...f, nodes: f.nodes.slice(0, 1), edges: [] }))}>One node</button>
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
