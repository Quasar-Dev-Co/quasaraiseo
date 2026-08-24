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

interface BrandConfig {
  pattern: RegExp;
  Icon: any;
  color: string;
  name: string;
  letter: string;
}

const BRANDS: BrandConfig[] = [
  { pattern: /gpt-5|gpt5|o3|o4|o1|codex/i, Icon: OpenAI, color: "#000000", name: "OpenAI", letter: "O" },
  { pattern: /gpt-4|gpt-3|gpt-|openai|dalle|text-embedding|tts|whisper|davinci|babbage/i, Icon: OpenAI, color: "#10a37f", name: "OpenAI", letter: "O" },
  { pattern: /claude/i, Icon: Claude, color: "#d4a27f", name: "Anthropic", letter: "C" },
  { pattern: /anthropic/i, Icon: Anthropic, color: "#d4a27f", name: "Anthropic", letter: "A" },
  { pattern: /gemini-3\.1/i, Icon: Gemini, color: "#4285f4", name: "Google", letter: "G" },
  { pattern: /gemini/i, Icon: Gemini, color: "#4285f4", name: "Google", letter: "G" },
  { pattern: /gemma/i, Icon: Gemini, color: "#4285f4", name: "Google", letter: "G" },
  { pattern: /deepseek|deep-hermes/i, Icon: DeepSeek, color: "#4d6bfe", name: "DeepSeek", letter: "D" },
  { pattern: /grok/i, Icon: Grok, color: "#000000", name: "xAI", letter: "X" },
  { pattern: /qwen|qwq|qvq|tongyi|wanx/i, Icon: Qwen, color: "#615ced", name: "Alibaba", letter: "Q" },
  { pattern: /glm-5|glm5|glm-4|glm4/i, Icon: ZAI, color: "#3b5bfd", name: "Zhipu AI", letter: "Z" },
  { pattern: /glm|chatglm/i, Icon: ChatGLM, color: "#3b5bfd", name: "Zhipu AI", letter: "Z" },
  { pattern: /llama|l3$|\/l3/i, Icon: Meta, color: "#0668e1", name: "Meta", letter: "M" },
  { pattern: /mistral|mixtral|codestral|mathstral|pixtral|ministral|magistral|devstral|voxtral/i, Icon: Mistral, color: "#ff7000", name: "Mistral", letter: "M" },
  { pattern: /command|cohere|aya/i, Icon: Cohere, color: "#39594d", name: "Cohere", letter: "C" },
  { pattern: /phi|wizardlm|microsoft/i, Icon: Microsoft, color: "#0078d4", name: "Microsoft", letter: "M" },
  { pattern: /yi/i, Icon: Yi, color: "#003eff", name: "01.AI", letter: "Y" },
  { pattern: /dbrx/i, Icon: Dbrx, color: "#ff3621", name: "Databricks", letter: "D" },
  { pattern: /nova/i, Icon: Nova, color: "#ff9900", name: "Amazon", letter: "A" },
  { pattern: /nemotron|nvidia|nv-/i, Icon: Nvidia, color: "#76b900", name: "NVIDIA", letter: "N" },
  { pattern: /kimi|moonshot/i, Icon: Moonshot, color: "#000000", name: "Moonshot", letter: "M" },
  { pattern: /hunyuan/i, Icon: Hunyuan, color: "#1e6fff", name: "Tencent", letter: "H" },
  { pattern: /baichuan/i, Icon: Baichuan, color: "#ff6a00", name: "Baichuan", letter: "B" },
  { pattern: /spark/i, Icon: Spark, color: "#1e6fff", name: "iFlytek", letter: "S" },
  { pattern: /step/i, Icon: Stepfun, color: "#ff6a00", name: "StepFun", letter: "S" },
  { pattern: /minimax|abab/i, Icon: Minimax, color: "#ff6a00", name: "MiniMax", letter: "M" },
  { pattern: /pplx|sonar|perplexity/i, Icon: Perplexity, color: "#20b8a4", name: "Perplexity", letter: "P" },
  { pattern: /jamba|ai21|j2-/i, Icon: Ai21, color: "#5a6cff", name: "AI21", letter: "A" },
  { pattern: /solar/i, Icon: Upstage, color: "#ff6a00", name: "Upstage", letter: "U" },
  { pattern: /internlm|internvl/i, Icon: InternLM, color: "#1e6fff", name: "InternLM", letter: "I" },
  { pattern: /openchat/i, Icon: OpenChat, color: "#1e6fff", name: "OpenChat", letter: "O" },
  { pattern: /inflection/i, Icon: Inflection, color: "#ff6a00", name: "Inflection", letter: "I" },
  { pattern: /phind/i, Icon: Phind, color: "#ff6a00", name: "Phind", letter: "P" },
  { pattern: /arcee|trinity|virtuoso/i, Icon: Arcee, color: "#ff6a00", name: "Arcee", letter: "A" },
];

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h} 70% 45%)`;
}

function getModelBrand(modelId: string): BrandConfig & { isUnknown: boolean } {
  for (const brand of BRANDS) {
    if (brand.pattern.test(modelId)) {
      return { ...brand, isUnknown: false };
    }
  }
  const color = stringToColor(modelId);
  const prefix = modelId.split(/[-_.\s]/)[0] || modelId;
  const letter = prefix.charAt(0).toUpperCase() || "?";
  return {
    pattern: /.*/,
    Icon: null as any,
    color,
    name: prefix.toUpperCase() || "AI",
    letter,
    isUnknown: true,
  };
}

function formatModelLabel(id: string, label?: string): string {
  if (label && label.trim() && label !== id) return label;
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/gpt /i, "GPT ")
    .replace(/glm /i, "GLM ")
    .replace(/claude /i, "Claude ");
}

function ModelIcon({ modelId, size = 20 }: { modelId: string; size?: number }) {
  const brand = getModelBrand(modelId);
  const iconSize = typeof size === "number" ? size * 0.6 : size;

  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden"
      style={{ width: size, height: size, backgroundColor: brand.color }}
    >
      {brand.isUnknown ? (
        <span className="font-bold text-white" style={{ fontSize: size * 0.45, lineHeight: 1 }}>
          {brand.letter}
        </span>
      ) : brand.Icon ? (
        <brand.Icon size={iconSize} style={{ color: "#fff" }} />
      ) : (
        <span className="font-bold text-white" style={{ fontSize: size * 0.45, lineHeight: 1 }}>
          {brand.letter}
        </span>
      )}
    </span>
  );
}

interface ModelSelectorProps {
  models: ModelRecord[];
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
  dark?: boolean;
  compact?: boolean;
}

export function ModelSelector({ models, value, onChange, className = "", dark = false, compact = false }: ModelSelectorProps) {
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
    const label = formatModelLabel(m.id, m.label).toLowerCase();
    const provider = getModelBrand(m.id).name.toLowerCase();
    return m.id.toLowerCase().includes(q) || label.includes(q) || provider.includes(q);
  });

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={compact
          ? `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              dark
                ? "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`
          : `flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              dark
                ? "border-slate-600 bg-slate-800 text-white hover:border-blue-500"
                : "border-slate-300 bg-white text-slate-900 hover:border-fuchsia-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
            }`}
      >
        <ModelIcon modelId={value} size={compact ? 16 : 20} />
        <span className={`truncate text-left ${compact ? "max-w-[120px]" : "flex-1"}`}>
          {formatModelLabel(value, selectedModel?.label)}
        </span>
        <ChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${compact ? "size-3" : "size-4"}`} />
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
                  <div className="font-medium text-slate-900 dark:text-white">{formatModelLabel(m.id, m.label)}</div>
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

export { DEFAULT_MODEL, getModelBrand, formatModelLabel };
