"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";

import { ModelSelector, type ModelRecord } from "@/components/ModelSelector";
import { Button } from "@/components/ui/button";
import { aiProviderApi } from "@/lib/ai-provider-api";

// Lets the super user choose the one model every other account runs on.
export function FixedModelCard({
  activeProvider,
  currentModel,
  onSaved,
}: {
  activeProvider: "openai" | "openrouter";
  currentModel: string;
  onSaved: () => void | Promise<void>;
}) {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [value, setValue] = useState(currentModel);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    aiProviderApi.listModels()
      .then((res) => setModels(res.models.map((m) => ({ id: m.id, label: m.id === currentModel ? m.id : m.label }))))
      .catch(() => setModels([]));
  }, [activeProvider, currentModel]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await aiProviderApi.setFixedModel(value, activeProvider);
      setMessage({ ok: true, text: res.message });
      await onSaved();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save the model." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <Lock className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">Fixed model for all users</h4>
          <p className="mt-0.5 text-[12px] text-slate-600 dark:text-slate-400">
            Every account except yours uses this {activeProvider === "openai" ? "OpenAI" : "OpenRouter"} model for chat, posts, audits and the web builder. Other users can&apos;t see or change the model list.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <ModelSelector models={models} value={value} onChange={setValue} className="flex-1" />
            <Button type="button" onClick={save} disabled={saving || !value || value === currentModel} className="shrink-0">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save model
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Currently fixed: <strong className="text-slate-700 dark:text-slate-300">{currentModel || "provider default"}</strong></p>
          {message && (
            <p className={`mt-2 flex items-center gap-1.5 text-[12px] ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
              {message.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />} {message.text}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
