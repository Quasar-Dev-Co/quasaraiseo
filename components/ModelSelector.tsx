"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  OpenAI, Claude, Anthropic, Gemini, DeepSeek, Grok, Qwen,
  ZAI, ChatGLM, Meta, Mistral, Cohere, Microsoft, Yi, Dbrx,
  Nova, Nvidia, Moonshot, Hunyuan, Baichuan, Spark, Stepfun,
  Minimax, Perplexity, Ai21, Arcee, Upstage, InternLM, OpenChat,
  Aya, Inflection, Phind,
} from "@lobehub/icons";

export interface ModelRecord {
  id: string;
  label?: string;
}

const DEFAULT_MODEL = "glm-5.2";
const STORAGE_KEY = "quasar_selected_model";

type IconComponent = React.ComponentType<{ size?: number; [key: string]: any }> & {
  Color?: React.ComponentType<{ size?: number }>;
  Avatar?: React.ComponentType<any>;
};

interface ModelBrand {
  Icon: IconComponent;
  name: string;
}

function getModelBrand(modelId: string): ModelBrand {
  const id = modelId.toLowerCase();
  if (id.includes("gpt-4")) return { Icon: OpenAI as any, name: "OpenAI" };
  if (id.includes("gpt-5")) return { Icon: OpenAI as any, name: "OpenAI" };
  if (id.includes("gpt-3")) return { Icon: OpenAI as any, name: "OpenAI" };
  if (id.includes("o1") || id.includes("o3") || id.includes("o4")) return { Icon: OpenAI as any, name: "OpenAI" };
  if (id.includes("gpt") || id.includes("openai")) return { Icon: OpenAI as any, name: "OpenAI" };
  if (id.includes("dalle")) return { Icon: OpenAI as any, name: "OpenAI" };
  if (id.includes("claude")) return { Icon: Claude as any, name: "Anthropic" };
  if (id.includes("anthropic")) return { Icon: Anthropic as any, name: "Anthropic" };
  if (id.includes("gemini")) return { Icon: Gemini as any, name: "Google" };
  if (id.includes("gemma")) return { Icon: Gemini as any, name: "Google" };
  if (id.includes("deepseek")) return { Icon: DeepSeek as any, name: "DeepSeek" };
  if (id.includes("grok")) return { Icon: Grok as any, name: "xAI" };
  if (id.includes("qwen") || id.includes("qwq") || id.includes("qvq")) return { Icon: Qwen as any, name: "Alibaba" };
  if (id.includes("glm-5") || id.includes("glm-4") || id.includes("glm5") || id.includes("glm4")) return { Icon: ZAI as any, name: "Zhipu AI" };
  if (id.includes("glm")) return { Icon: ChatGLM as any, name: "Zhipu AI" };
  if (id.includes("chatglm")) return { Icon: ChatGLM as any, name: "Zhipu AI" };
  if (id.includes("llama") || id.includes("/l3")) return { Icon: Meta as any, name: "Meta" };
  if (id.includes("mistral") || id.includes("mixtral") || id.includes("codestral")) return { Icon: Mistral as any, name: "Mistral" };
  if (id.includes("command") || id.includes("cohere")) return { Icon: Cohere as any, name: "Cohere" };
  if (id.includes("phi") || id.includes("wizardlm")) return { Icon: Microsoft as any, name: "Microsoft" };
  if (id.includes("yi-") || id.includes("/yi-")) return { Icon: Yi as any, name: "01.AI" };
  if (id.includes("dbrx")) return { Icon: Dbrx as any, name: "Databricks" };
  if (id.includes("nova")) return { Icon: Nova as any, name: "Amazon" };
  if (id.includes("nemotron") || id.includes("nvidia")) return { Icon: Nvidia as any, name: "NVIDIA" };
  if (id.includes("kimi") || id.includes("moonshot")) return { Icon: Moonshot as any, name: "Moonshot" };
  if (id.includes("hunyuan")) return { Icon: Hunyuan as any, name: "Tencent" };
  if (id.includes("baichuan")) return { Icon: Baichuan as any, name: "Baichuan" };
  if (id.includes("spark")) return { Icon: Spark as any, name: "iFlytek" };
  if (id.includes("step")) return { Icon: Stepfun as any, name: "StepFun" };
  if (id.includes("minimax") || id.includes("abab")) return { Icon: Minimax as any, name: "MiniMax" };
  if (id.includes("pplx") || id.includes("sonar")) return { Icon: Perplexity as any, name: "Perplexity" };
  if (id.includes("jamba") || id.includes("ai21")) return { Icon: Ai21 as any, name: "AI21" };
  if (id.includes("solar")) return { Icon: Upstage as any, name: "Upstage" };
  if (id.includes("internlm") || id.includes("internvl")) return { Icon: InternLM as any, name: "InternLM" };
  if (id.includes("openchat")) return { Icon: OpenChat as any, name: "OpenChat" };
  if (id.includes("aya")) return { Icon: Aya as any, name: "Cohere" };
  if (id.includes("inflection")) return { Icon: Inflection as any, name: "Inflection" };
  if (id.includes("phind")) return { Icon: Phind as any, name: "Phind" };
  if (id.includes("arcee") || id.includes("trinity")) return { Icon: Arcee as any, name: "Arcee" };
  return { Icon: OpenAI as any, name: "AI" };
}

function ModelIcon({ modelId, size = 20 }: { modelId: string; size?: number }) {
  const { Icon } = getModelBrand(modelId);
  try {
    return <Icon size={size} />;
  } catch {
    return <span className="inline-flex items-center justify-center rounded-md bg-slate-400 text-white font-bold" style={{ width: size, height: size, fontSize: size * 0.5 }}>AI</span>;
  }
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
        <ModelIcon modelId={value} />
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
                <ModelIcon modelId={m.id} size={22} />
                <div className="flex-1 truncate">
                  <div className="font-medium text-slate-900 dark:text-white">{m.label || m.id}</div>
                  <div className="text-xs text-slate-400">{getModelBrand(m.id).name}</div>
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

export { DEFAULT_MODEL, ModelIcon, getModelBrand };
