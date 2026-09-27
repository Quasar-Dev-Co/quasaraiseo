"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Pencil, RefreshCw, RotateCcw, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { costsApi, type CostSummary, type ModelPrice } from "@/lib/costs-api";

// Super-user view of what the paid APIs cost: totals, a daily chart, and
// breakdowns by model, feature and user, with editable per-model prices.

const RANGES = [7, 30, 90] as const;

function usd(v: number): string {
  if (v === 0) return "$0.00";
  // API calls often cost fractions of a cent; keep 4 decimals below $1.
  if (v < 1) return `$${v.toFixed(4)}`;
  if (v < 100) return `$${v.toFixed(2)}`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function tokens(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
}

const SOURCE_LABEL: Record<string, string> = {
  provider: "Billed by provider",
  custom: "Your price",
  synced: "Synced price",
  catalog: "List price",
  unpriced: "No price",
};

function SourceBadge({ source }: { source: string }) {
  const tone = source === "unpriced"
    ? "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20"
    : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${tone}`}>
      {source === "unpriced" && <AlertTriangle className="size-3" />}
      {SOURCE_LABEL[source] ?? source}
    </span>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
      {note && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}

function Section({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
      <header className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
        <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">{title}</h4>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const th = "px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap";
const thNum = `${th} text-right`;
const td = "px-4 py-2 text-[12px] text-slate-700 dark:text-slate-300 whitespace-nowrap";
const tdNum = `${td} text-right tabular-nums`;

function DayTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { costUsd: number; calls: number } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] shadow-lg dark:border-white/10 dark:bg-slate-800">
      <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
      <p className="tabular-nums text-slate-700 dark:text-slate-300">{usd(d.costUsd)} · {d.calls} calls</p>
    </div>
  );
}

function PriceEditor({
  model, price, onClose, onSaved,
}: { model: string; price: ModelPrice | null; onClose: () => void; onSaved: () => void }) {
  const [input, setInput] = useState(price ? String(price.inputPer1M) : "");
  const [cached, setCached] = useState(price?.cachedInputPer1M != null ? String(price.cachedInputPer1M) : "");
  const [output, setOutput] = useState(price ? String(price.outputPer1M) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const i = Number(input), o = Number(output), c = cached.trim() === "" ? null : Number(cached);
    if (!Number.isFinite(i) || !Number.isFinite(o) || i < 0 || o < 0 || (c !== null && (!Number.isFinite(c) || c < 0))) {
      setError("Enter prices as numbers, e.g. 0.20");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await costsApi.setPrice({ model, inputPer1M: i, cachedInputPer1M: c, outputPer1M: o });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try { await costsApi.resetPrice(model); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Could not reset"); } finally { setBusy(false); }
  };

  const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums dark:border-white/15 dark:bg-slate-800 dark:text-white";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Price for {model}</h4>
            <p className="mt-0.5 text-[12px] text-slate-500">US dollars per 1 million tokens. Past calls for this model are recalculated.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="size-4" /></button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Input<input className={field} value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" /></label>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Cached input<input className={field} value={cached} onChange={(e) => setCached(e.target.value)} placeholder="= input" inputMode="decimal" /></label>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Output<input className={field} value={output} onChange={(e) => setOutput(e.target.value)} inputMode="decimal" /></label>
        </div>
        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reset} disabled={busy || price?.source !== "custom"} title="Go back to the synced or list price">
            <RotateCcw className="size-3.5" /> Use default
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={busy}>
            {busy && <Loader2 className="size-3.5 animate-spin" />} Save price
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CostTab() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ model: string; price: ModelPrice | null } | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    costsApi.summary(days)
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load costs"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days, reloadKey]);

  const reload = (range = days) => {
    setLoading(true);
    if (range !== days) setDays(range);
    else setReloadKey((k) => k + 1);
  };

  const totals = data?.totals;
  const unpriced = totals?.unpricedCalls ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">API Costs</h3>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
            Every OpenAI, OpenRouter and DataForSEO call made by any account, with tokens and cost. Days are in UTC.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => reload(r)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-semibold ${days === r ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}
              >
                {r} days
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => reload()} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">{error}</p>}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading costs…</div>
      ) : data && totals ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label={`Total cost · ${days} days`} value={usd(totals.costUsd)} note={unpriced ? `${unpriced} calls have no price yet` : "All calls priced"} />
            <StatTile label="API calls" value={totals.calls.toLocaleString()} />
            <StatTile label="Input tokens" value={tokens(totals.inputTokens)} note={totals.cachedTokens ? `${tokens(totals.cachedTokens)} cached` : undefined} />
            <StatTile label="Output tokens" value={tokens(totals.outputTokens)} />
          </div>

          {unpriced > 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Some models have no known price, so their calls count as $0. Click <strong className="mx-1">Set price</strong> next to them below to fill it in; past calls update automatically.
            </p>
          )}

          <Section title="Daily cost" hint="Hover a bar for the exact amount.">
            {data.byDay.length === 0 ? (
              <p className="px-4 py-6 text-[12px] text-slate-500">No API calls in this period yet.</p>
            ) : (
              <div className="h-56 px-2 py-3 text-[#2a78d6] dark:text-[#3987e5]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byDay} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(d: string) => d.slice(5)} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v: number) => usd(v)} width={64} />
                    <Tooltip content={<DayTooltip />} cursor={{ fill: "currentColor", fillOpacity: 0.06 }} />
                    <Bar dataKey="costUsd" fill="currentColor" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          <Section title="By model" hint="Price is US dollars per 1M tokens (input / output). OpenRouter and DataForSEO report their exact charge per call.">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-white/5">
                <th className={th}>Model</th><th className={thNum}>Calls</th><th className={thNum}>Input</th><th className={thNum}>Cached</th>
                <th className={thNum}>Output</th><th className={th}>Price</th><th className={th}>Cost from</th><th className={thNum}>Cost</th><th className={th} />
              </tr></thead>
              <tbody>
                {data.byModel.map((m) => (
                  <tr key={`${m.provider}:${m.model}`} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                    <td className={td}><span className="font-semibold text-slate-900 dark:text-white">{m.model}</span><span className="ml-2 text-[11px] text-slate-400">{m.provider}</span></td>
                    <td className={tdNum}>{m.calls.toLocaleString()}</td>
                    <td className={tdNum}>{tokens(m.inputTokens)}</td>
                    <td className={tdNum}>{tokens(m.cachedTokens)}</td>
                    <td className={tdNum}>{tokens(m.outputTokens)}</td>
                    <td className={`${td} tabular-nums`}>{m.price ? `$${m.price.inputPer1M} / $${m.price.outputPer1M}` : "—"}</td>
                    <td className={td}><div className="flex flex-wrap gap-1">{m.costSources.map((s) => <SourceBadge key={s} source={s} />)}</div></td>
                    <td className={`${tdNum} font-bold text-slate-900 dark:text-white`}>{usd(m.costUsd)}</td>
                    <td className={td}>
                      {m.provider !== "dataforseo" && !(m.costSources.length === 1 && m.costSources[0] === "provider") && (
                        <button type="button" onClick={() => setEditing({ model: m.model, price: m.price })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                          <Pencil className="size-3" /> {m.price ? "Edit price" : "Set price"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.byModel.length === 0 && <tr><td className={td} colSpan={9}>No calls yet.</td></tr>}
              </tbody>
            </table>
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="By feature">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100 dark:border-white/5"><th className={th}>Feature</th><th className={thNum}>Calls</th><th className={thNum}>Tokens</th><th className={thNum}>Cost</th></tr></thead>
                <tbody>
                  {data.byFeature.map((f) => (
                    <tr key={f.feature} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                      <td className={td}>{f.feature}</td><td className={tdNum}>{f.calls.toLocaleString()}</td>
                      <td className={tdNum}>{tokens(f.inputTokens + f.outputTokens)}</td><td className={`${tdNum} font-bold`}>{usd(f.costUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <Section title="By user">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100 dark:border-white/5"><th className={th}>User</th><th className={thNum}>Calls</th><th className={thNum}>Tokens</th><th className={thNum}>Cost</th></tr></thead>
                <tbody>
                  {data.byUser.map((u) => (
                    <tr key={u.userId ?? "system"} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                      <td className={td}>{u.email ? <><span className="font-semibold text-slate-900 dark:text-white">{u.name || u.email}</span>{u.name && <span className="ml-2 text-[11px] text-slate-400">{u.email}</span>}</> : <span className="text-slate-500">System / background jobs</span>}</td>
                      <td className={tdNum}>{u.calls.toLocaleString()}</td><td className={tdNum}>{tokens(u.inputTokens + u.outputTokens)}</td>
                      <td className={`${tdNum} font-bold`}>{usd(u.costUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>

          <Section title="Latest calls" hint="The 100 most recent calls in this period.">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-white/5">
                <th className={th}>Time</th><th className={th}>User</th><th className={th}>Feature</th><th className={th}>Model</th>
                <th className={thNum}>Input</th><th className={thNum}>Output</th><th className={thNum}>Cost</th>
              </tr></thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                    <td className={td}>{new Date(r.createdAt).toLocaleString()}</td>
                    <td className={td}>{r.email || "System"}</td>
                    <td className={td}>{r.feature}</td>
                    <td className={td}>{r.model}{r.kind === "image" && <span className="ml-1.5 text-[10px] text-slate-400">image</span>}</td>
                    <td className={tdNum}>{tokens(r.inputTokens)}</td>
                    <td className={tdNum}>{tokens(r.outputTokens)}{r.reasoningTokens ? <span className="ml-1 text-[10px] text-slate-400">({tokens(r.reasoningTokens)} reasoning)</span> : null}</td>
                    <td className={`${tdNum} font-semibold`} title={SOURCE_LABEL[r.costSource]}>{r.costSource === "unpriced" ? "no price" : usd(r.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      ) : null}

      {editing && (
        <PriceEditor
          model={editing.model}
          price={editing.price}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}
