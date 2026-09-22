"use client";

import { useEffect, useState } from "react";
import { Images, Loader2, X } from "lucide-react";
import { keywordMcpApi } from "@/lib/keyword-mcp-api";

type MediaItem = { id: number; title: string; url: string; alt: string };

export function WebsiteMediaGallery({
  open,
  sessionId,
  aiImages,
  onAiImagesChange,
  onClose,
  onUse,
}: {
  open: boolean;
  sessionId: string;
  aiImages: boolean;
  onAiImagesChange: (enabled: boolean) => void;
  onClose: () => void;
  onUse: (items: MediaItem[]) => void;
}) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setLoading(true);
    setError(null);
    keywordMcpApi.listWebsiteMedia(sessionId)
      .then((result) => {
        setMedia(result.media);
        setSiteName(result.siteName);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load images"))
      .finally(() => setLoading(false));
  }, [open, sessionId]);

  if (!open) return null;

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(0, 8));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-300"><Images className="size-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Website images</h3>
              <p className="text-xs text-slate-500">{siteName || "Images already uploaded on the connected site"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/70 px-4 py-3 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10">
            <input
              type="checkbox"
              checked={aiImages}
              onChange={(e) => onAiImagesChange(e.target.checked)}
              className="mt-1 size-4 accent-fuchsia-600"
            />
            <span>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">AI images</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-600 dark:text-slate-300">
                Generate a different image for every new page and post. Posts show the section heading. Pages show the logo and the scene only, with no text.
              </span>
            </span>
          </label>
          {loading && <div className="flex items-center justify-center py-16 text-slate-500"><Loader2 className="size-5 animate-spin" /></div>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {!loading && !error && media.length === 0 && (
            <p className="py-16 text-center text-sm text-slate-500">No images found on the connected website yet.</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {media.map((item) => {
              const active = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`overflow-hidden rounded-xl border text-left ${active ? "border-fuchsia-500 ring-2 ring-fuchsia-400" : "border-slate-200 dark:border-white/10"}`}
                >
                  <img src={item.url} alt={item.alt || item.title} className="aspect-square w-full object-cover" />
                  <p className="truncate px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">{item.title}</p>
                </button>
              );
            })}
          </div>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-white/10">
          <p className="text-xs text-slate-500">{selected.length} selected</p>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              onUse(media.filter((item) => selected.includes(item.id)));
              onClose();
            }}
            className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Use selected
          </button>
        </footer>
      </div>
    </div>
  );
}
