"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Zap } from "lucide-react";

export interface ModelRecord {
  id: string;
  label?: string;
}

const DEFAULT_MODEL = "glm-5.2";
const STORAGE_KEY = "quasar_selected_model";

function getModelBrand(modelId: string): { name: string; color: string; letter: string } {
  const id = modelId.toLowerCase();
  if (id.includes("gpt") || id.includes("o1") || id.includes("o3") || id.includes("o4") || id.includes("chatgpt")) return { name: "OpenAI", color: "#10a37f", letter: "G" };
  if (id.includes("claude") || id.includes("anthropic")) return { name: "Anthropic", color: "#d4a27f", letter: "C" };
  if (id.includes("gemini") || id.includes("google")) return { name: "Google", color: "#4285f4", letter: "G" };
  if (id.includes("deepseek")) return { name: "DeepSeek", color: "#4d6bfe", letter: "D" };
  if (id.includes("grok")) return { name: "xAI", color: "#000000", letter: "X" };
  if (id.includes("qwen") || id.includes("qwq")) return { name: "Alibaba", color: "#615ced", letter: "Q" };
  if (id.includes("glm") || id.includes("zhipu")) return { name: "Zhipu", color: "#3b5bfd", letter: "Z" };
  if (id.includes("llama") || id.includes("meta")) return { name: "Meta", color: "#0668e1", letter: "L" };
  if (id.includes("mistral") || id.includes("mixtral")) return { name: "Mistral", color: "#ff7000", letter: "M" };
  if (id.includes("command") || id.includes("cohere")) return { name: "Cohere", color: "#39594d", letter: "C" };
  if (id.includes("phi")) return { name: "Microsoft", color: "#0078d4", letter: "M" };
  if (id.includes("yi")) return { name: "01.AI", color: "#003eff", letter: "Y" };
  if (id.includes("dbrx")) return { name: "Databricks", color: "#ff3621", letter: "D" };
  if (id.includes("nova")) return { name: "Amazon", color: "#ff9900", letter: "A" };
  return { name: "AI", color: "#6366f1", letter: "A" };
}

function ModelIcon({ modelId, size = 20 }: { modelId: string; size?: number }) {
  const brand = getModelBrand(modelId);
  return (
    <span
      className="inline-flex items-center justify-center rounded-md font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: brand.color,
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
    >
      {brand.letter}
    </span>
  );
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
        <div className="absolute z-50 mt-1 w-full min-w-[260px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto py-1">
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
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  m.id === value ? "bg-blue-50 dark:bg-blue-900/30" : ""
                }`}
              >
                <ModelIcon modelId={m.id} />
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
