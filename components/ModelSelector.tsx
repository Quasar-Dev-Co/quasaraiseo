"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { ModelIcon } from "@lobehub/icons";

export interface ModelRecord {
  id: string;
  label?: string;
}

const DEFAULT_MODEL = "glm-5.2";
const STORAGE_KEY = "quasar_selected_model";

function getModelProviderName(modelId: string): string {
  const id = modelId.toLowerCase();
  if (id.includes("gpt") || id.includes("o1") || id.includes("o3") || id.includes("o4") || id.includes("openai") || id.includes("dalle")) return "OpenAI";
  if (id.includes("claude") || id.includes("anthropic")) return "Anthropic";
  if (id.includes("gemini") || id.includes("gemma")) return "Google";
  if (id.includes("deepseek")) return "DeepSeek";
  if (id.includes("grok")) return "xAI";
  if (id.includes("qwen") || id.includes("qwq") || id.includes("qvq")) return "Alibaba";
  if (id.includes("glm")) return "Zhipu AI";
  if (id.includes("llama") || id.includes("/l3")) return "Meta";
  if (id.includes("mistral") || id.includes("mixtral") || id.includes("codestral")) return "Mistral";
  if (id.includes("command") || id.includes("cohere") || id.includes("aya")) return "Cohere";
  if (id.includes("phi") || id.includes("wizardlm") || id.includes("microsoft")) return "Microsoft";
  if (id.includes("yi-") || id.includes("/yi-")) return "01.AI";
  if (id.includes("dbrx")) return "Databricks";
  if (id.includes("nova")) return "Amazon";
  if (id.includes("nemotron") || id.includes("nvidia")) return "NVIDIA";
  if (id.includes("kimi") || id.includes("moonshot")) return "Moonshot";
  if (id.includes("hunyuan")) return "Tencent";
  if (id.includes("baichuan")) return "Baichuan";
  if (id.includes("spark")) return "iFlytek";
  if (id.includes("step")) return "StepFun";
  if (id.includes("minimax") || id.includes("abab")) return "MiniMax";
  if (id.includes("pplx") || id.includes("sonar")) return "Perplexity";
  if (id.includes("jamba") || id.includes("ai21")) return "AI21";
  if (id.includes("solar")) return "Upstage";
  if (id.includes("internlm") || id.includes("internvl")) return "InternLM";
  if (id.includes("openchat")) return "OpenChat";
  if (id.includes("inflection")) return "Inflection";
  if (id.includes("phind")) return "Phind";
  if (id.includes("arcee") || id.includes("trinity")) return "Arcee";
  return "AI";
}

interface ModelSelectorProps {
  models: ModelRecord[];
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
  dark?: boolean;
}

export function ModelSelector({ models, value, onChange, className = "", dark = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedModel = models.find((m) => m.id === value);
  const filtered = models.filter((m) => {
    const q = search.toLowerCase();
    return m.id.toLowerCase().includes(q) || (m.label || "").toLowerCase().includes(q);
  });

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
          dark
            ? "border-slate-600 bg-slate-800 text-white hover:border-blue-500"
            : "border-slate-300 bg-white text-slate-900 hover:border-fuchsia-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
        }`}
      >
        <ModelIcon model={value} size={20} type="avatar" shape="circle" />
        <span className="flex-1 truncate text-left">
          {selectedModel?.label || selectedModel?.id || value}
        </span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">No models found</div>
            )}
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  m.id === value ? "bg-blue-50 dark:bg-blue-900/30" : ""
                }`}
              >
                <ModelIcon model={m.id} size={22} type="avatar" shape="circle" />
                <div className="flex-1 truncate">
                  <div className="font-medium text-slate-900 dark:text-white">{m.label || m.id}</div>
                  <div className="text-xs text-slate-400">{getModelProviderName(m.id)}</div>
                </div>
                {m.id === value && <Check className="size-4 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function usePersistentModel(models: ModelRecord[]) {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setSelectedModel(saved);
    }
  }, []);

  useEffect(() => {
    if (models.length > 0) {
      const exists = models.find((m) => m.id === selectedModel);
      if (!exists && !localStorage.getItem(STORAGE_KEY)) {
        setSelectedModel(DEFAULT_MODEL);
      }
    }
  }, [models, selectedModel]);

  const setModel = (modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, modelId);
    }
  };

  return { selectedModel, setModel };
}

export { DEFAULT_MODEL, getModelProviderName };
