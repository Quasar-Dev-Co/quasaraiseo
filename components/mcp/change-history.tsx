"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, History, Loader2, Undo2, X } from "lucide-react";

import { keywordMcpApi, type McpChange } from "@/lib/keyword-mcp-api";

// Everything the chat changed on the website or in saved pages, with an Undo for
// each. Undoing is recorded too, so an undo can itself be undone.

function ago(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function what(c: McpChange): string {
  const noun = c.kind === "content_file" ? "saved page" : c.postType === "page" ? "page" : "post";
  return `${c.label} · ${noun}`;
}

export function ChangeHistory({ sessionId, refreshKey, disabled }: { sessionId: string | null; refreshKey: number; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"chat" | "all">("chat");
  const [changes, setChanges] = useState<McpChange[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; message: string } | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setChanges(await keywordMcpApi.getChanges(scope === "chat" && sessionId ? sessionId : undefined));
    } catch {
      setChanges(null);
      setNotice({ ok: false, text: "Could not load the history." });
    } finally {
      setLoading(false);
    }
  }, [scope, sessionId]);

  useEffect(() => { if (open) void load(); }, [open, load, refreshKey]);
  useEffect(() => { if (!open) return; const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open]);

  const undo = async (id: string, force = false) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await keywordMcpApi.revertChange(id, force);
      if (res.needsConfirm) { setConfirm({ id, message: res.message }); return; }
      setConfirm(null);
      setNotice({ ok: res.ok, text: res.message });
      if (res.ok) await load();
    } catch {
      setNotice({ ok: false, text: "Could not undo this change." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        title="History: see what the chat changed and undo it"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <History className="size-3.5" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[120] flex justify-end bg-slate-950/50" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <aside role="dialog" aria-label="Change history" className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">History</h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Everything the chat changed. Undo puts it back how it was.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close history" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="size-4" /></button>
            </header>

            <div className="flex gap-1 border-b border-slate-200 px-5 py-2.5 dark:border-white/10" role="group" aria-label="Which changes">
              {([["chat", "This chat"], ["all", "All chats"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={scope === key}
                  onClick={() => setScope(key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scope === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {notice && (
              <p role="status" className={`mx-5 mt-3 rounded-lg border px-3 py-2 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"}`}>
                {notice.text}
              </p>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {loading && !changes ? (
                <p className="flex items-center gap-2 py-6 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" /> Loading…</p>
              ) : !changes || changes.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">
                  Nothing yet. When the chat creates or edits a post, page or saved content page, it shows up here.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-white/5">
                  {changes.map((c) => (
                    <li key={c.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{c.title || "Untitled"}</p>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {what(c)}{c.siteName ? ` · ${c.siteName}` : ""} · {ago(c.createdAt)}
                          </p>
                          {c.reverted && <p className="mt-1 text-xs font-medium text-slate-500">Undone</p>}
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
                              Open <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                        {c.canUndo && (
                          <button
                            type="button"
                            disabled={busyId === c.id}
                            onClick={() => void undo(c.id)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:border-brand-700 hover:text-brand-700 disabled:opacity-50 dark:border-white/15 dark:text-slate-100"
                          >
                            {busyId === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <Undo2 className="size-3.5" />} Undo
                          </button>
                        )}
                      </div>
                      {confirm?.id === c.id && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                          <p>{confirm.message}</p>
                          <div className="mt-2 flex gap-2">
                            <button type="button" onClick={() => void undo(c.id, true)} disabled={busyId === c.id} className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">Undo anyway</button>
                            <button type="button" onClick={() => setConfirm(null)} className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white/60 dark:text-slate-200">Keep as is</button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
              New posts are moved to the WordPress trash when undone, never deleted for good. Schema markup stored separately by the plugin is not part of undo.
            </footer>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
