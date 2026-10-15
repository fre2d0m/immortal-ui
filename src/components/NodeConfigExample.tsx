import React, { useState } from "react";
import { Cpu } from "lucide-react";
import {
  ImmortalButton,
  ImmortalInput,
  ImmortalSelect,
  ImmortalSlider,
  ImmortalSwitch,
  ImmortalCard,
  ImmortalBadge,
} from "./ImmortalComponents";
import { ImmortalModal } from "./ImmortalModal";
import { useToast } from "./ImmortalToast";

export function NodeConfigExample() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Composite Form example state
  const [formName, setFormName] = useState("Immortal-Worker-01");
  const [formEngine, setFormEngine] = useState("linear");
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formCache, setFormCache] = useState(true);

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configuration Saved",
      description: `Node [${formName}] tactile parameters synced to local environment`,
      type: "success",
    });
  };

  return (
    <>
      <ImmortalCard
        title="Composite Example: AI Compute Node Configuration"
        description="Showcasing buttons, recessed inputs, sliders, and switches working together in a production form"
        badge={<ImmortalBadge dotColor="white">Production Ready</ImmortalBadge>}
        headerAction={
          <ImmortalButton
            variant="recessed"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Advanced Optics
          </ImmortalButton>
        }
      >
        <form
          onSubmit={handleSaveForm}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">
                Node Service Identifier
              </label>
              <ImmortalInput
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="worker-immortal-instance"
                icon={<Cpu className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-col gap-2">
              <ImmortalSelect
                label="Scheduling Engine"
                value={formEngine}
                onChange={setFormEngine}
                options={[
                  {
                    value: "linear",
                    label: "Linear-Cluster Ultra Performance",
                  },
                  {
                    value: "distributed",
                    label: "Distributed Low-Power Scheduler",
                  },
                  { value: "failover", label: "Active-Active Redundant Array" },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ImmortalSlider
              label="Max Context Tokens"
              value={formMaxTokens}
              min={1024}
              max={8192}
              step={512}
              unit=" T"
              onChange={setFormMaxTokens}
            />

            <ImmortalSwitch
              checked={formCache}
              onChange={setFormCache}
              label="High-Speed KV Cache Warmup"
              hint="Reduces time-to-first-token latency to 15ms"
            />
          </div>

          <div className="immortal-container md:col-span-2 flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Ready · 1 pending change</span>
            </div>

            <div className="flex items-center gap-3">
              <ImmortalButton
                type="button"
                variant="recessed"
                size="sm"
                onClick={() => {
                  setFormName("Immortal-Worker-01");
                  setFormEngine("linear");
                  setFormMaxTokens(4096);
                  setFormCache(true);
                  toast({
                    title: "Form Reset",
                    type: "info",
                  });
                }}
              >
                Reset
              </ImmortalButton>
              <ImmortalButton type="submit" variant="metallic" size="sm">
                Save & Deploy
              </ImmortalButton>
            </div>
          </div>
        </form>
      </ImmortalCard>
      <ImmortalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Advanced Immortal Optics"
        description="Fine-tune diagonal specular sharpness and bevel curvature for high-DPI displays."
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Environment Configuration
            </label>
            <ImmortalInput defaultValue="DARK_SKEUOMORPHIC_SPECULAR_ENABLE=true" />
          </div>

          <ImmortalSwitch
            checked={true}
            onChange={() => {}}
            label="Secondary Ambient Bounce"
            hint="Simulate natural bottom-right bounce light across beveled rims"
          />

          <ImmortalSlider
            label="Convex Surface Depth"
            value={74}
            onChange={() => {}}
          />
        </div>
      </ImmortalModal>
    </>
  );
}
