"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings, CheckCircle2, Circle, Loader2, ChevronRight,
  Globe2, BarChart3, FileSpreadsheet, Smartphone, Bell,
  Shield, Mail, Download, RefreshCw, ExternalLink, Plug, Zap,
  Monitor, Tablet, KeyRound, Clock, MapPin, Trash2, LogOut, AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { googleApi, type GoogleStatus, type DeviceInfo } from "@/lib/google-api";

const GIcon = ({ c }: { c?: string }) => (
  <svg className={c} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${checked ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}>
      <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

const card = "overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50";
const hdr = "flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5";

function SettingsInner() {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [pwaOn, setPwaOn] = useState(true);
  const [notifOn, setNotifOn] = useState(true);
  const [twoFAOn, setTwoFAOn] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const [s, devs] = await Promise.all([
        googleApi.getStatus(),
        googleApi.getDevices(),
      ]);
      setStatus(s);
      setDevices(devs.length > 0 ? devs : [
        { id: "local", name: "This Device", type: "desktop", location: "Unknown", ip: "127.0.0.1", lastActive: "Active now", current: true },
      ]);
    } catch {
      setDevices([
        { id: "local", name: "This Device", type: "desktop", location: "Unknown", ip: "127.0.0.1", lastActive: "Active now", current: true },
      ]);
    } finally {
      // loading complete
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const googleParam = searchParams.get("google");
    const errorParam = searchParams.get("error");
    if (googleParam === "connected") {
      fetchStatus();
    }
    if (errorParam) {
      setError(`Google connection failed: ${errorParam}`);
    }
  }, [searchParams, fetchStatus]);

  const handleConnectAll = async () => {
    setConnecting(true);
    setError(null);
    try {
      const authUrl = await googleApi.getAuthUrl();
      window.location.href = authUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
      setConnecting(false);
    }
  };

  const handleConnectSingle = async () => {
    setConnecting(true);
    setError(null);
    try {
      const authUrl = await googleApi.getAuthUrl();
      window.location.href = authUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await googleApi.disconnect();
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect");
    }
  };

  const handleToggle2FA = async (enable: boolean) => {
    setTwoFAOn(enable);
    try {
      if (enable) {
        await googleApi.enable2FA();
      } else {
        await googleApi.disable2FA();
      }
      await fetchStatus();
    } catch (e) {
      setTwoFAOn(!enable);
      setError(e instanceof Error ? e.message : "2FA update failed");
    }
  };

  const handleRevokeDevice = async (sessionId: string) => {
    try {
      await googleApi.revokeDevice(sessionId);
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke device");
    }
  };

  const handleRevokeAllDevices = async () => {
    try {
      await googleApi.revokeAllDevices();
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke devices");
    }
  };

  const connected = status?.connected ?? false;
  const connectedEmail = status?.email;
  const svcList = [
    { id: "gsc", name: "Google Search Console", desc: "Pull search performance data, indexing status, and URL inspection results into your audits.", icon: Globe2, scope: "webmasters.readonly", isOn: status?.services.searchConsole ?? false },
    { id: "ga4", name: "Google Analytics (GA4)", desc: "Import traffic data, audience insights, and content performance metrics for reporting.", icon: BarChart3, scope: "analytics.readonly", isOn: status?.services.analytics ?? false },
    { id: "sheets", name: "Google Sheets", desc: "Sync task management data bidirectionally — app updates reflect in sheets and vice versa.", icon: FileSpreadsheet, scope: "spreadsheets", isOn: status?.services.sheets ?? false },
  ];
  const cnt = svcList.filter((s) => s.isOn).length;

  return (
    <RequireAuth>
      <DashboardLayout>
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
            <Settings className="size-3.5" /> Configuration
          </div>
          <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            Manage Google integrations, PWA configuration, notification preferences, and workspace settings.
          </p>
        </section>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
            <AlertCircle className="size-4.5 shrink-0" /> {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { i: Plug, l: "Integrations", v: `${cnt}/${svcList.length}` },
            { i: Smartphone, l: "PWA", v: pwaOn ? "On" : "Off" },
            { i: Bell, l: "Alerts", v: notifOn ? "On" : "Off" },
            { i: Monitor, l: "Devices", v: `${devices.length}` },
            { i: Shield, l: "2FA", v: twoFAOn ? "On" : "Off", green: twoFAOn },
          ].map((s) => (
            <article key={s.l} className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><s.i className="size-4" /> {s.l}</div>
              <div className={`mt-2 text-3xl font-black ${s.green ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>{s.v}</div>
            </article>
          ))}
        </div>

        <Tabs defaultValue="google">
          <TabsList className="mb-6 h-auto gap-1 rounded-[14px] bg-slate-100/80 p-1.5 dark:bg-slate-900/60">
            <TabsTrigger value="google" className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold data-active:bg-white data-active:text-slate-900 data-active:shadow-sm dark:data-active:bg-slate-800 dark:data-active:text-white"><GIcon c="size-4" /> Google Connect</TabsTrigger>
            <TabsTrigger value="pwa" className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold data-active:bg-white data-active:text-slate-900 data-active:shadow-sm dark:data-active:bg-slate-800 dark:data-active:text-white"><Smartphone className="size-4" /> PWA</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold data-active:bg-white data-active:text-slate-900 data-active:shadow-sm dark:data-active:bg-slate-800 dark:data-active:text-white"><Bell className="size-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="security" className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold data-active:bg-white data-active:text-slate-900 data-active:shadow-sm dark:data-active:bg-slate-800 dark:data-active:text-white"><Shield className="size-4" /> Security</TabsTrigger>
            <TabsTrigger value="workspace" className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold data-active:bg-white data-active:text-slate-900 data-active:shadow-sm dark:data-active:bg-slate-800 dark:data-active:text-white"><Settings className="size-4" /> Workspace</TabsTrigger>
          </TabsList>

          {/* GOOGLE TAB */}
          <TabsContent value="google">
            <div className="space-y-5">
              <article className="overflow-hidden rounded-3xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/90 to-white dark:border-emerald-400/15 dark:from-emerald-400/5 dark:to-slate-900/50">
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(16,185,129,0.15)] dark:bg-slate-800"><GIcon c="size-6" /></span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">One-Click Google Connect</h3>
                      <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">Connect all Google services at once with a single OAuth sign-in.</p>
                    </div>
                  </div>
                  <Button size="lg" className="h-12 shrink-0 gap-2.5 rounded-[14px] bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(16,185,129,0.25)]"
                    onClick={handleConnectAll} disabled={connecting || connected}>
                    {connecting ? <><Loader2 className="size-4 animate-spin" /> Redirecting...</> : connected ? <><CheckCircle2 className="size-4" /> Connected</> : <><Zap className="size-4" /> Connect All</>}
                  </Button>
                </div>
              </article>

              {svcList.map((s) => {
                const Icon = s.icon;
                return (
                  <article key={s.id} className={card}>
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${s.isOn ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}><Icon className="size-5" /></span>
                        <div className="max-w-[480px]">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{s.name}</h3>
                            {s.isOn ? <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"><CheckCircle2 className="size-3" /> Connected</Badge> : <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Circle className="size-3" /> Not Connected</Badge>}
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{s.desc}</p>
                          {connected && connectedEmail && s.isOn && <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400"><Mail className="size-3" /> {connectedEmail}</div>}
                          <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-md bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">{s.scope}</span></div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!connected ? <Button size="lg" className="h-11 gap-2 rounded-[12px] border border-slate-200 bg-white px-5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200" onClick={handleConnectSingle} disabled={connecting}><GIcon c="size-4" /> {connecting ? "Connecting..." : "Connect"}</Button> : <div className="flex gap-2"><Button size="lg" variant="outline" className="h-11 gap-2 rounded-[12px] px-4 text-[13px] font-bold"><RefreshCw className="size-3.5" /> Sync</Button><Button size="lg" variant="destructive" className="h-11 gap-2 rounded-[12px] px-4 text-[13px] font-bold" onClick={handleDisconnect}>Disconnect</Button></div>}
                      </div>
                    </div>
                  </article>
                );
              })}

              <article className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-white/5 dark:bg-slate-900/30">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Shield className="size-4" /></span>
                  <div><h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Data Privacy &amp; Security</h4><p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">Read-only access for Search Console and Analytics. Sheets requires read/write for task sync. Tokens encrypted, never stored in plaintext. Revoke anytime.</p></div>
                </div>
              </article>
            </div>
          </TabsContent>

          {/* PWA TAB */}
          <TabsContent value="pwa">
            <div className="space-y-5">
              <article className={card}>
                <header className={hdr}>
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><Smartphone className="size-[18px]" /></span>
                    <div><h3 className="m-0 text-base text-slate-900 dark:text-white">Progressive Web App</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Install on any device — works offline</p></div>
                  </div>
                  <Toggle checked={pwaOn} onChange={() => setPwaOn(!pwaOn)} />
                </header>
                {pwaOn && (
                  <div className="space-y-4 p-6">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-white shadow-sm dark:bg-slate-800"><Download className="size-5 text-emerald-600 dark:text-emerald-400" /></span>
                        <div><h4 className="text-[14px] font-bold text-slate-900 dark:text-white">Install as Desktop App</h4><p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">Native app experience with offline support</p></div>
                      </div>
                      <Button size="sm" className="gap-1.5"><Download className="size-3.5" /> Install</Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { t: "Offline Mode", d: "Access cached audits without internet", i: RefreshCw, on: true },
                        { t: "Push Notifications", d: "Audit completion alerts on device", i: Bell, on: true },
                        { t: "Background Sync", d: "Queue actions, sync when online", i: Zap, on: true },
                        { t: "App Shortcuts", d: "Quick actions for audit, reports, tasks", i: ChevronRight, on: false },
                      ].map((f) => (
                        <div key={f.t} className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/40">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"><f.i className="size-4" /></span>
                              <div><h4 className="text-[13px] font-bold text-slate-900 dark:text-white">{f.t}</h4><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{f.d}</p></div>
                            </div>
                            <Toggle checked={f.on} onChange={() => {}} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500"><ExternalLink className="size-3" /> PWA Manifest</div>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
                        {[["Name","QuasarAISEO"],["Display","Standalone"],["Theme","#10b981"],["Icons","mainlogo.png"]].map(([k, v]) => (
                          <div key={k}><span className="block text-[10px] font-bold uppercase text-slate-400">{k}</span><span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </div>
          </TabsContent>

          {/* NOTIFICATIONS + WORKSPACE TABS */}
          <TabsContent value="notifications">
            <article className={card}>
              <header className={hdr}>
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><Bell className="size-[18px]" /></span>
                  <div><h3 className="m-0 text-base text-slate-900 dark:text-white">Notification Preferences</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Control how and when you get alerts</p></div>
                </div>
                <Toggle checked={notifOn} onChange={() => setNotifOn(!notifOn)} />
              </header>
              {notifOn && (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {[
                    { t: "Audit Completion", d: "Get notified when an SEO audit finishes processing", on: true },
                    { t: "Task Assignments", d: "Receive alerts when a new task is assigned to you", on: true },
                    { t: "Weekly Digest", d: "Summary of audits, tasks, and scores every Monday", on: false },
                    { t: "Sheet Sync Errors", d: "Alert when Google Sheets sync fails or has conflicts", on: true },
                    { t: "Security Alerts", d: "Notifications for login attempts and API key changes", on: true },
                  ].map((item) => (
                    <div key={item.t} className="flex items-center justify-between px-6 py-4">
                      <div><h4 className="text-[14px] font-bold text-slate-900 dark:text-white">{item.t}</h4><p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{item.d}</p></div>
                      <Toggle checked={item.on} onChange={() => {}} />
                    </div>
                  ))}
                </div>
              )}
            </article>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security">
            <div className="space-y-5">
              {/* 2FA Card */}
              <article className={card}>
                <header className={hdr}>
                  <div className="flex gap-2.75">
                    <span className={`grid size-9 place-items-center rounded-[12px] ${twoFAOn ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}><KeyRound className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Toggle checked={twoFAOn} onChange={() => handleToggle2FA(!twoFAOn)} />
                </header>
                {twoFAOn ? (
                  <div className="space-y-4 p-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/5">
                      <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"><CheckCircle2 className="size-5" /></span>
                      <div>
                        <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">2FA is Active</h4>
                        <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">Your account is protected with authenticator app verification.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5"><Smartphone className="size-4 text-emerald-600 dark:text-emerald-400" /><h4 className="text-[13px] font-bold text-slate-900 dark:text-white">Authenticator App</h4></div>
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Google Authenticator · Enabled</p>
                        <Button size="xs" variant="outline" className="mt-3 gap-1.5"><RefreshCw className="size-3" /> Reconfigure</Button>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5"><Mail className="size-4 text-slate-400" /><h4 className="text-[13px] font-bold text-slate-900 dark:text-white">Backup via Email</h4></div>
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Receive backup codes on your email</p>
                        <Button size="xs" variant="outline" className="mt-3 gap-1.5"><Download className="size-3" /> Download Codes</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-400/15 dark:bg-amber-400/5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400"><Shield className="size-4" /></span>
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">2FA is Disabled</h4>
                        <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">Enable 2FA to require a verification code from your authenticator app in addition to your password. This protects your account even if your password is compromised.</p>
                        <Button size="sm" className="mt-3 gap-1.5" onClick={() => handleToggle2FA(true)}><KeyRound className="size-3.5" /> Enable 2FA</Button>
                      </div>
                    </div>
                  </div>
                )}
              </article>

              {/* Active Devices Card */}
              <article className={card}>
                <header className={hdr}>
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><Monitor className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Active Device Sessions</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{devices.length} device{devices.length !== 1 ? "s" : ""} currently logged in</p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleRevokeAllDevices}><LogOut className="size-3.5" /> Revoke All Others</Button>
                </header>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {devices.map((d) => {
                    const DIcon = d.type === "mobile" ? Smartphone : d.type === "tablet" ? Tablet : Monitor;
                    return (
                      <div key={d.id} className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-start gap-3.5">
                          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${d.current ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}><DIcon className="size-5" /></span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">{d.name}</h4>
                              {d.current && <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"><CheckCircle2 className="size-3" /> This device</Badge>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1"><MapPin className="size-3" /> {d.location}</span>
                              <span className="flex items-center gap-1 font-mono text-slate-400">{d.ip}</span>
                              <span className="flex items-center gap-1"><Clock className="size-3" /> {d.lastActive}</span>
                            </div>
                          </div>
                        </div>
                        {!d.current && (
                          <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => handleRevokeDevice(d.id)}><Trash2 className="size-3.5" /> Revoke</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            </div>
          </TabsContent>

          <TabsContent value="workspace">
            <div className="space-y-5">
              <article className={card}>
                <header className={hdr}>
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><Settings className="size-[18px]" /></span>
                    <div><h3 className="m-0 text-base text-slate-900 dark:text-white">Workspace Settings</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">General preferences for your account</p></div>
                  </div>
                </header>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {[
                    { t: "Auto-update Reports", d: "Automatically regenerate PDF reports when data changes", on: true },
                    { t: "Default Export Format", d: "Choose PDF or JSON as default download format", on: true },
                    { t: "Compact Mode", d: "Reduce padding and spacing for denser layouts", on: false },
                    { t: "Beta Features", d: "Enable early-access features and experimental tools", on: false },
                  ].map((item) => (
                    <div key={item.t} className="flex items-center justify-between px-6 py-4">
                      <div><h4 className="text-[14px] font-bold text-slate-900 dark:text-white">{item.t}</h4><p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{item.d}</p></div>
                      <Toggle checked={item.on} onChange={() => {}} />
                    </div>
                  ))}
                </div>
              </article>

              <article className={card}>
                <header className={hdr}>
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400"><Shield className="size-[18px]" /></span>
                    <div><h3 className="m-0 text-base text-slate-900 dark:text-white">Danger Zone</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Irreversible actions</p></div>
                  </div>
                </header>
                <div className="space-y-3 p-6">
                  <div className="flex items-center justify-between rounded-2xl border border-red-200/50 bg-red-50/40 p-4 dark:border-red-400/15 dark:bg-red-400/5">
                    <div><h4 className="text-[14px] font-bold text-slate-900 dark:text-white">Revoke All Google Access</h4><p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">Disconnect all Google services and delete stored tokens</p></div>
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleDisconnect}>Revoke All</Button>
                  </div>
                </div>
              </article>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </RequireAuth>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}
