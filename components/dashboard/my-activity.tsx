"use client";

import { useEffect, useState } from "react";
import { Clock, Globe2, Layers, Wrench } from "lucide-react";

import { featureLabel, fetchMyInsights, type MyInsights } from "@/lib/insights-api";

// "Your activity": a plain summary of where the signed-in person's time and AI
// usage went. It is personal for everyone, admins included.

const RANGES = [7, 30, 90] as const;

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatMinutes(m: number): string {
  if (m < 1) return "0 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

function prettyTool(name: string): string {
  const s = name.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Tile({ icon: Icon, label, value, note }: { icon: typeof Clock; label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-card p-4 dark:border-white/10">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-400">
        <Icon className="size-4 text-brand-700 dark:text-brand-300" /> {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  );
}

function BarList({ title, hint, rows, empty }: { title: string; hint: string; rows: Array<{ label: string; sub?: string; value: number; display: string }>; empty: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="rounded-lg border border-slate-200 bg-card p-4 dark:border-white/10">
      <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-slate-600 dark:text-slate-400">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate font-medium text-slate-900 dark:text-slate-100" title={r.label}>{r.label}</span>
                <span className="shrink-0 tabular-nums text-slate-700 dark:text-slate-300">{r.display}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-brand-700 dark:bg-brand-400" style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} />
              </div>
              {r.sub && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.sub}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function summarize(d: MyInsights): string {
  if (d.totals.activeMinutes === 0 && d.totals.tokens === 0) return "";
  const sentences: string[] = [];
  const top = d.websites.find((w) => w.minutes > 0);
  if (d.totals.activeMinutes > 0) {
    const where = top ? (d.websites.filter((w) => w.minutes > 0).length > 1 ? `, most of it on ${top.name}` : `, all on ${top.name}`) : "";
    sentences.push(`You were active for about ${formatMinutes(d.totals.activeMinutes)} in MCP Chat${where}.`);
  }
  const tool = d.tools[0];
  if (tool) sentences.push(`Your most-used tool was ${prettyTool(tool.name).toLowerCase()}.`);
  const area = d.byFeature[0];
  if (area && d.totals.tokens > 0) sentences.push(`Most of your AI tokens went to ${featureLabel(area.feature)}.`);
  return sentences.join(" ");
}

export function MyActivity() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<MyInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyInsights(days)
      .then((d) => { if (!cancelled) { setData(d); setFailed(false); } })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const pick = (r: number) => { if (r !== days) { setLoading(true); setDays(r); } };
  const summary = data ? summarize(data) : "";
  const topWebsite = data?.websites.find((w) => w.minutes > 0);

  return (
    <section aria-labelledby="my-activity-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="my-activity-title" className="text-[15px] font-semibold text-slate-950 dark:text-white">Your activity</h2>
          <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-400">Where your time and AI usage went. Only you see this.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pick(r)}
              aria-pressed={days === r}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${days === r ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {failed && !data ? (
        <p className="rounded-lg border border-slate-200 bg-card px-4 py-3 text-[13px] text-slate-600 dark:border-white/10 dark:text-slate-400">
          Your activity isn&apos;t available right now. It will appear here once the server is updated.
        </p>
      ) : loading && !data ? (
        <div className="h-32 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none dark:bg-white/5" aria-hidden />
      ) : data && data.totals.activeMinutes === 0 && data.totals.tokens === 0 && data.totals.toolCalls === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center dark:border-white/15">
          <p className="text-sm text-slate-700 dark:text-slate-300">No activity in the last {days} days yet.</p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Start a chat in MCP Chat or write a post, and your time, tokens and tools will show up here.</p>
        </div>
      ) : data ? (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {summary && <p className="mb-3 max-w-[80ch] text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">{summary}</p>}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile icon={Clock} label="Active time" value={formatMinutes(data.totals.activeMinutes)} note="Estimated from your chat activity" />
            <Tile icon={Layers} label="AI tokens used" value={formatTokens(data.totals.tokens)} note={`${data.totals.aiCalls.toLocaleString()} AI requests`} />
            <Tile icon={Wrench} label="Tools used" value={String(data.totals.distinctTools)} note={`${data.totals.toolCalls.toLocaleString()} tool runs in total`} />
            <Tile icon={Globe2} label="Top website" value={topWebsite ? topWebsite.name : "None yet"} note={topWebsite ? `${formatMinutes(topWebsite.minutes)} across ${topWebsite.chats} ${topWebsite.chats === 1 ? "chat" : "chats"}` : "Pick a website in MCP Chat"} />
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <BarList
              title="Time by website"
              hint="Active time in MCP Chat"
              empty="Choose a website when you start an MCP chat to see it here."
              rows={data.websites.filter((w) => w.minutes > 0).slice(0, 5).map((w) => ({
                label: w.name,
                sub: `${w.messages} ${w.messages === 1 ? "message" : "messages"} · ${formatTokens(w.tokens)} tokens`,
                value: w.minutes,
                display: formatMinutes(w.minutes),
              }))}
            />
            <BarList
              title="Tools you use most"
              hint="Times the AI ran each tool for you"
              empty="Tools appear after the AI runs something for you, like keyword research."
              rows={data.tools.slice(0, 5).map((t) => ({ label: prettyTool(t.name), value: t.count, display: `${t.count}×` }))}
            />
            <BarList
              title="Tokens by area"
              hint="Which part of the app used the AI"
              empty="No AI usage yet."
              rows={data.byFeature.slice(0, 5).map((f) => ({ label: featureLabel(f.feature), sub: `${f.calls} ${f.calls === 1 ? "request" : "requests"}`, value: f.tokens, display: formatTokens(f.tokens) }))}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
