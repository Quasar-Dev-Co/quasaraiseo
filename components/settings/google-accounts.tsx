"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, RefreshCw, Star, Trash2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { googleApi, type GoogleAccount, type GoogleServices } from "@/lib/google-api";

// Every Google login the admin has connected. Search Console sites and
// Analytics properties from all of them show up together, for everyone on the
// team; Sheets uses the primary account.

const SERVICES: Array<[keyof GoogleServices, string]> = [
  ["searchConsole", "Search Console"],
  ["analytics", "Analytics"],
  ["sheets", "Sheets"],
];

function connectedOn(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function GoogleAccounts({
  isSuper,
  reloadKey = 0,
  onChange,
}: {
  isSuper: boolean;
  /** Bump to reload, for example after returning from Google sign-in. */
  reloadKey?: number;
  /** Called after an account is added, removed or made primary. */
  onChange?: () => void;
}) {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [multiAccount, setMultiAccount] = useState(true);
  const [loading, setLoading] = useState(true);
  /** Account id being changed, or "connect" while redirecting to Google. */
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => googleApi.getAccounts()
    .then((result) => {
      setAccounts(result.accounts);
      setMultiAccount(result.multiAccount);
      setError(null);
    })
    .catch((e) => setError(e instanceof Error ? e.message : "Could not load Google accounts."))
    .finally(() => setLoading(false)), []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const connect = async (options?: { addAccount?: boolean; loginHint?: string }) => {
    setBusy("connect");
    setError(null);
    try {
      window.location.href = await googleApi.getAuthUrl(options);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Google sign-in.");
      setBusy(null);
    }
  };

  const remove = async (account: GoogleAccount) => {
    const others = accounts.length > 1
      ? " Websites from the other accounts stay available."
      : " Search Console, Analytics and Sheets stop working until a Google account is connected again.";
    if (!confirm(`Disconnect ${account.email}?${others}`)) return;
    setBusy(account.id);
    setError(null);
    try {
      if (multiAccount) await googleApi.disconnectAccount(account.id);
      else await googleApi.disconnect();
      await load();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disconnect this account.");
    } finally {
      setBusy(null);
    }
  };

  const makePrimary = async (account: GoogleAccount) => {
    setBusy(account.id);
    setError(null);
    try {
      await googleApi.setPrimaryAccount(account.id);
      await load();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change the primary account.");
    } finally {
      setBusy(null);
    }
  };

  const canAdd = isSuper && (multiAccount || accounts.length === 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Google accounts</h3>
          <p className="mt-1 max-w-[560px] text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
            Connect every Google account that has access to a client&apos;s Search Console or Analytics. Websites from all of
            them show up together in Search Console and Analytics, for everyone on the team.
          </p>
        </div>
        {canAdd ? (
          <Button
            size="lg"
            className="h-11 shrink-0 gap-2 rounded-[12px] bg-blue-600 px-5 text-[13px] font-bold text-white hover:bg-blue-700"
            onClick={() => connect(accounts.length > 0 ? { addAccount: true } : undefined)}
            disabled={busy !== null}
          >
            {busy === "connect" ? (
              <><Loader2 className="size-4 animate-spin" /> Opening Google…</>
            ) : accounts.length > 0 ? (
              <><Plus className="size-4" /> Add Google account</>
            ) : (
              <><Zap className="size-4" /> Connect Google</>
            )}
          </Button>
        ) : !isSuper ? (
          <span className="shrink-0 rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400">
            Managed by the admin
          </span>
        ) : null}
      </header>

      {error && (
        <p className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-6 py-3 text-[13px] font-semibold text-red-700 dark:border-red-400/10 dark:bg-red-400/10 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3 p-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : accounts.length === 0 ? (
        <p className="px-6 py-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
          No Google account connected yet.
          {isSuper ? " Connect one to see Search Console and Analytics data." : " Ask the admin to connect one."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {accounts.map((account) => {
            const date = connectedOn(account.connectedAt);
            const working = busy === account.id;
            return (
              <li key={account.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-black uppercase text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                    {account.email.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[14px] font-bold text-slate-900 dark:text-white">{account.email}</span>
                      {account.isPrimary && accounts.length > 1 && (
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300" title="Google Sheets uses this account">
                          <Star className="size-3" /> Primary
                        </Badge>
                      )}
                      {account.error && (
                        <Badge variant="destructive" title={account.error}>
                          <AlertCircle className="size-3" /> Needs reconnect
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {SERVICES.map(([key, label]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            account.services[key]
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
                              : "bg-slate-50 text-slate-400 line-through dark:bg-slate-800/50 dark:text-slate-500"
                          }`}
                        >
                          {account.services[key] && <CheckCircle2 className="size-3" />}
                          {label}
                        </span>
                      ))}
                      {date && <span className="ml-1 text-[11px] text-slate-500 dark:text-slate-400">Connected {date}</span>}
                    </div>
                  </div>
                </div>

                {isSuper && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {account.error && (
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={busy !== null}
                        onClick={() => connect({ addAccount: multiAccount, loginHint: account.email })}>
                        <RefreshCw className="size-3.5" /> Reconnect
                      </Button>
                    )}
                    {multiAccount && accounts.length > 1 && !account.isPrimary && !account.error && account.services.sheets && (
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={busy !== null} onClick={() => makePrimary(account)}>
                        <Star className="size-3.5" /> Make primary
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="gap-1.5" disabled={busy !== null} onClick={() => remove(account)}>
                      {working ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Disconnect
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isSuper && !loading && !multiAccount && accounts.length > 0 && (
        <p className="border-t border-slate-100 bg-amber-50/60 px-6 py-3 text-[12px] leading-relaxed text-amber-900 dark:border-white/5 dark:bg-amber-400/5 dark:text-amber-200">
          Adding more Google accounts needs the latest backend. Until it is deployed, the server keeps one Google connection,
          so this account stays the only one.
        </p>
      )}
    </article>
  );
}
