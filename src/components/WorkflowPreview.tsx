import { useState } from "react";
import { DataWorkflow } from "@/components/blocks/data-workflow";
import { parseWorkflow } from "@/components/blocks/workflow-model";
import { Button } from "@/components/ui/button";
import {
  createWorkflowDemo,
  summarizeWorkflowDemoNode,
  workflowTemplates,
  type WorkflowDemoScenario,
} from "@/lib/workflow-demo-data";
import { runWorkflowDemo } from "@/lib/workflow-demo-runner";
import { migrateWorkflowDemoLanguage } from "@/lib/workflow-demo-language";
import "./workflow-preview.css";

const draftKey = "immortal-workflow-demo-draft-v2";
function initialDraft() {
  try {
    const saved = localStorage.getItem(draftKey);
    if (saved) return migrateWorkflowDemoLanguage(parseWorkflow(saved));
  } catch {
    /* The preview remains usable when local storage is unavailable. */
  }
  return createWorkflowDemo();
}
export function WorkflowPreview() {
  const [workflow, setWorkflow] = useState(initialDraft);
  const [scenario, setScenario] = useState<WorkflowDemoScenario>("normal");
  const [revision, setRevision] = useState(0);
  const [running, setRunning] = useState(false);
  return (
    <section
      className="preview-shell block-preview workflow-preview"
      lang="en"
      aria-label="Interactive workflow preview"
    >
      <div className="block-preview-bar">
        <p className="block-preview-label">
          Interactive preview <span>Demo data · Simulated execution</span>
        </p>
        <div className="workflow-demo-controls" data-slot="control-row">
          <select
            data-slot="select-trigger"
            aria-label="Demo input scenario"
            disabled={running}
            value={scenario}
            onChange={(event) =>
              setScenario(event.target.value as WorkflowDemoScenario)
            }
          >
            <option value="normal">Normal water · 18 / 20 / 22 °C</option>
            <option value="warm">Warmer water · 24 / 26 / 28 °C</option>
            <option value="missing">Missing data · 18 / missing / 22 °C</option>
            <option value="failure">Weather source failure</option>
          </select>
          <Button
            variant="ghost"
            disabled={running}
            onClick={() => {
              setWorkflow({
                schemaVersion: 1,
                id: "empty-demo",
                name: "New data workflow",
                maxConcurrency: 3,
                nodes: [],
                edges: [],
              });
              setRevision((value) => value + 1);
            }}
          >
            Blank workflow
          </Button>
          <Button
            variant="ghost"
            disabled={running}
            onClick={() => {
              setWorkflow(createWorkflowDemo());
              setRevision((value) => value + 1);
            }}
          >
            Reset example
          </Button>
        </div>
      </div>
      <DataWorkflow
        key={`${scenario}-${revision}`}
        workflow={workflow}
        publication={{ workflowId: workflow.id, status: "draft" }}
        onChange={setWorkflow}
        templates={workflowTemplates}
        getNodeSummary={summarizeWorkflowDemoNode}
        runLabel="Test workflow"
        onSave={async (flow) => {
          try {
            localStorage.setItem(draftKey, JSON.stringify(flow));
          } catch {
            throw new Error(
              "Could not save the local draft. Export JSON to keep a copy.",
            );
          }
        }}
        onRun={async (flow, context) => {
          setRunning(true);
          try {
            return await runWorkflowDemo(flow, scenario, context);
          } finally {
            setRunning(false);
          }
        }}
      />
      <details className="workflow-demo-notes">
        <summary>About this example</summary>
        <p>
          Drafts are saved only in this browser. This demo does not connect to
          devices, write to a database or send notifications. Change the input
          scenario above to test the same workflow.
        </p>
        <p>
          Normal samples average 20 °C and are archived; warmer samples average
          26 °C and are sent for review. Weather and water-temperature
          observations are read in parallel, joined, then aggregated by metric
          and unit. The 21 °C threshold is for demonstration only. Inspect raw
          inputs and processed outputs in Run results. Models, scheduling and
          actual delivery are supplied by the host service.
        </p>
      </details>
    </section>
  );
}
