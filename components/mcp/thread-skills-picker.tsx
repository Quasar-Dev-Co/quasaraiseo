"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Package, Upload, X } from "lucide-react";

import { wordpressApi, type PostSkillRecord } from "@/lib/wordpress-api";

// Chooses which skills (from the shared skill library, the same one Post Create
// uses) apply to the current chat thread, and uploads new ones.
export function ThreadSkillsPicker({
  selectedIds,
  onChange,
  disabled,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<PostSkillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // The composer toolbar scrolls sideways, which would clip a normal dropdown,
  // so the panel is portaled to <body> and pinned above the button.
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    wordpressApi.listPostSkills()
      .then((res) => { if (!cancelled) setSkills(res.skills || []); })
      .catch(() => { if (!cancelled) setError("Could not load skills."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id].slice(0, 10));
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(md|markdown|zip)$/i.test(file.name)) {
      setError("Upload a skill as a .md file or a .zip folder.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { skill } = await wordpressApi.uploadPostSkill(file);
      setSkills((prev) => [skill, ...prev]);
      onChange([...selectedIds, skill.id].slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const active = skills.filter((s) => selectedIds.includes(s.id));

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setAnchor({ left: Math.max(8, Math.min(r.left, window.innerWidth - 328)), bottom: window.innerHeight - r.top + 8 });
          setOpen((v) => !v);
        }}
        title="Choose skills for this chat"
        className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition disabled:opacity-40 ${
          selectedIds.length > 0
            ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-300"
            : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        <Package className="size-3.5" />
        Skills{selectedIds.length > 0 ? ` · ${selectedIds.length}` : ""}
      </button>

      {open && anchor && createPortal(
        <div
          ref={panelRef}
          style={{ left: anchor.left, bottom: anchor.bottom }}
          className="fixed z-[60] w-[320px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-white/5">
            <div>
              <p className="text-[12px] font-bold text-slate-900 dark:text-white">Skills for this chat</p>
              <p className="text-[10px] text-slate-500">Only this thread uses them. Same library as Post Create.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="size-3.5" /></button>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5">
            {loading && <p className="flex items-center gap-2 px-2 py-3 text-[12px] text-slate-500"><Loader2 className="size-3.5 animate-spin" /> Loading…</p>}
            {!loading && skills.length === 0 && (
              <p className="px-2 py-3 text-[12px] text-slate-500">No skills yet. Upload a SKILL.md file or a .zip skill folder.</p>
            )}
            {skills.map((skill) => {
              const on = selectedIds.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggle(skill.id)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition ${on ? "bg-brand-50 dark:bg-brand-400/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${on ? "border-brand-600 bg-brand-700 text-white hover:bg-brand-hover" : "border-slate-300 dark:border-white/20"}`}>
                    {on && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-slate-900 dark:text-white">{skill.name}</span>
                    {skill.description && <span className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{skill.description}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 p-2 dark:border-white/5">
            <input ref={fileRef} type="file" accept=".md,.markdown,.zip" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[12px] font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-50 dark:border-white/15 dark:text-slate-300"
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Upload skill (.md or .zip)
            </button>
            {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
            {active.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="mt-1.5 w-full text-center text-[11px] text-slate-500 hover:text-red-600">
                Turn off all skills for this chat
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
