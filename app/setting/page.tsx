"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings, CheckCircle2, Circle, Loader2, ChevronRight,
  Globe2, BarChart3, FileSpreadsheet, Smartphone, Bell,
  Shield, Mail, Download, RefreshCw, ExternalLink, Plug, Zap,
  Monitor, Tablet, KeyRound, Clock, MapPin, Trash2, LogOut, AlertCircle,
  Building2, Plus, Pencil, Star, X, Link2, Phone, MapPin as MapPinIcon, Upload, ChevronDown, Search, Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { googleApi, type GoogleStatus, type DeviceInfo } from "@/lib/google-api";
import { brandingApi, type Branding, type BrandingInput } from "@/lib/branding-api";
import { aiProviderApi, type AiProvider as ProviderType } from "@/lib/ai-provider-api";

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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${checked ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`}>
      <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance & Banking", "Education", "E-commerce & Retail",
  "Real Estate", "Manufacturing", "Marketing & Advertising", "Legal", "Hospitality & Tourism",
  "Construction", "Automotive", "Media & Entertainment", "Food & Beverage", "Agriculture",
  "Energy & Utilities", "Telecommunications", "Transportation & Logistics", "Insurance",
  "Consulting", "Non-profit", "Government", "Aerospace", "Pharmaceutical", "Fashion & Apparel",
  "Fitness & Wellness", "Gaming", "SaaS & Software", "AI & Automation",
];

function IndustryCombobox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = INDUSTRIES.filter((i) => i.toLowerCase().includes(search.toLowerCase()));
  const showCreate = search && !INDUSTRIES.some((i) => i.toLowerCase() === search.toLowerCase());

  const select = (v: string) => {
    setSearch(v);
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm text-slate-900 transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
      >
        <span className={value ? "text-slate-900 dark:text-white" : "text-slate-400"}>{value || "Select or type an industry..."}</span>
        <ChevronDown className={`size-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-800">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900/50">
            <Search className="size-4 text-slate-400" />
            <input
              autoFocus
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              value={search}
              onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); }}
              placeholder="Search or type industry..."
            />
          </div>
          <div className="mt-1 max-h-52 overflow-y-auto rounded-lg">
            {filtered.length === 0 && !showCreate && (
              <div className="px-3 py-2 text-xs text-slate-400">No results</div>
            )}
            {filtered.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => select(i)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-fuchsia-50 dark:hover:bg-fuchsia-400/10 ${value === i ? "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400" : "text-slate-700 dark:text-slate-200"}`}
              >
                {i}
              </button>
            ))}
            {showCreate && (
              <button
                type="button"
                onClick={() => select(search)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-fuchsia-700 transition hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-400/10"
              >
                Use "{search}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
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

  // Branding state
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [extractingBrand, setExtractingBrand] = useState(false);
  const [extractionStep, setExtractionStep] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [showBrandingForm, setShowBrandingForm] = useState(false);
  const [editingBranding, setEditingBranding] = useState<Branding | null>(null);

  // AI Provider state
  const [aiProvider, setAiProvider] = useState<ProviderType>("openai");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiDefaultModel, setAiDefaultModel] = useState("gpt-4o");
  const [aiSettings, setAiSettings] = useState<{ provider: string; defaultModel: string; hasApiKey: boolean; apiKeyPreview: string } | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; modelCount?: number } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [brandingForm, setBrandingForm] = useState<BrandingInput>({
    companyName: "",
    description: "",
    website: "",
    defaultColor: "#d946ef",
    logoUrl: "",
    industry: "",
    tagline: "",
    email: "",
    phone: "",
    address: "",
    socialLinks: {},
    isDefault: false,
  });

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

  // Branding handlers
  const fetchBrandings = useCallback(async () => {
    setBrandingLoading(true);
    try {
      const list = await brandingApi.getAll();
      setBrandings(list);
    } catch {
      // ignore
    } finally {
      setBrandingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrandings();
  }, [fetchBrandings]);

  // Load AI provider settings
  useEffect(() => {
    aiProviderApi.getSettings().then((res) => {
      if (res.settings) {
        setAiSettings(res.settings);
        setAiProvider(res.settings.provider as ProviderType);
        setAiDefaultModel(res.settings.defaultModel);
      }
    }).catch(() => {});
  }, []);

  const handleSaveAiProvider = async () => {
    if (!aiApiKey.trim()) {
      setAiError("API key is required.");
      return;
    }
    setAiSaving(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      await aiProviderApi.saveSettings({
        provider: aiProvider,
        apiKey: aiApiKey,
        defaultModel: aiDefaultModel || undefined,
      });
      setAiSuccess("AI provider settings saved successfully!");
      setAiApiKey("");
      // Reload settings
      const res = await aiProviderApi.getSettings();
      if (res.settings) {
        setAiSettings(res.settings);
        setAiProvider(res.settings.provider as ProviderType);
        setAiDefaultModel(res.settings.defaultModel);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setAiSaving(false);
    }
  };

  const handleTestAiProvider = async () => {
    if (!aiApiKey.trim()) {
      setAiError("Enter an API key to test.");
      return;
    }
    setAiTesting(true);
    setAiError(null);
    setAiTestResult(null);
    try {
      const result = await aiProviderApi.testProvider({
        provider: aiProvider,
        apiKey: aiApiKey,
      });
      setAiTestResult(result);
    } catch (err) {
      setAiTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Test failed.",
      });
    } finally {
      setAiTesting(false);
    }
  };

  const handleDeleteAiProvider = async () => {
    if (!confirm("Remove your AI provider settings? You'll need to re-enter them to use AI features.")) return;
    try {
      await aiProviderApi.deleteSettings();
      setAiSettings(null);
      setAiApiKey("");
      setAiSuccess("AI provider settings removed.");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to remove settings.");
    }
  };

  const resetBrandingForm = () => {
    setBrandingForm({
      companyName: "",
      description: "",
      website: "",
      defaultColor: "#d946ef",
      logoUrl: "",
      industry: "",
      tagline: "",
      email: "",
      phone: "",
      address: "",
      socialLinks: {},
      isDefault: false,
    });
    setEditingBranding(null);
    setShowBrandingForm(false);
  };

  const handleEditBranding = (b: Branding) => {
    setEditingBranding(b);
    setBrandingForm({
      companyName: b.companyName,
      description: b.description,
      website: b.website,
      defaultColor: b.defaultColor,
      logoUrl: b.logoUrl ?? "",
      industry: b.industry,
      tagline: b.tagline,
      email: b.email,
      phone: b.phone,
      address: b.address,
      socialLinks: b.socialLinks,
      isDefault: b.isDefault,
    });
    setShowBrandingForm(true);
  };

  const handleSaveBranding = async () => {
    if (!brandingForm.companyName.trim()) return;
    if (!(brandingForm.website ?? "").trim()) {
      setError("Website URL is required.");
      return;
    }
    setBrandingSaving(true);
    setError(null);
    try {
      let formData = brandingForm;

      if (!editingBranding) {
        setExtractionStep("Crawling website...");
        const extracted = await brandingApi.extractFromWebsite(
          brandingForm.companyName.trim(),
          (brandingForm.website ?? "").trim()
        );
        setExtractionStep("AI is analyzing brand info...");
        formData = {
          ...brandingForm,
          industry: extracted.industry ?? brandingForm.industry,
          tagline: extracted.tagline ?? brandingForm.tagline,
          description: extracted.description ?? brandingForm.description,
          email: extracted.email ?? brandingForm.email,
          phone: extracted.phone ?? brandingForm.phone,
          address: extracted.address ?? brandingForm.address,
          socialLinks: {
            twitter: extracted.socialLinks?.twitter ?? "",
            linkedin: extracted.socialLinks?.linkedin ?? "",
            facebook: extracted.socialLinks?.facebook ?? "",
            instagram: extracted.socialLinks?.instagram ?? "",
            youtube: extracted.socialLinks?.youtube ?? "",
          },
        };
        setBrandingForm(formData);
        setExtractionStep("Saving brand...");
      }

      if (editingBranding) {
        await brandingApi.update(editingBranding.id, formData);
      } else {
        await brandingApi.create(formData);
      }
      await fetchBrandings();
      resetBrandingForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save branding");
    } finally {
      setBrandingSaving(false);
      setExtractionStep("");
    }
  };

  const handleDeleteBranding = async (id: string) => {
    try {
      await brandingApi.delete(id);
      await fetchBrandings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete branding");
    }
  };

  const handleSetDefault = async (b: Branding) => {
    try {
      await brandingApi.update(b.id, { isDefault: true });
      await fetchBrandings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set default branding");
    }
  };

  const handleExtractBrandInfo = async () => {
    if (!brandingForm.companyName.trim() || !(brandingForm.website ?? "").trim()) {
      setError("Company name and website are required.");
      return;
    }
    setExtractingBrand(true);
    setError(null);
    try {
      const extracted = await brandingApi.extractFromWebsite(
        brandingForm.companyName.trim(),
        (brandingForm.website ?? "").trim()
      );
      setBrandingForm((prev) => ({
        ...prev,
        industry: extracted.industry ?? prev.industry,
        tagline: extracted.tagline ?? prev.tagline,
        description: extracted.description ?? prev.description,
        email: extracted.email ?? prev.email,
        phone: extracted.phone ?? prev.phone,
        address: extracted.address ?? prev.address,
        socialLinks: {
          twitter: extracted.socialLinks?.twitter ?? "",
          linkedin: extracted.socialLinks?.linkedin ?? "",
          facebook: extracted.socialLinks?.facebook ?? "",
          instagram: extracted.socialLinks?.instagram ?? "",
          youtube: extracted.socialLinks?.youtube ?? "",
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract brand info");
    } finally {
      setExtractingBrand(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const logoUrl = await brandingApi.uploadLogo(file);
      setBrandingForm((prev) => ({ ...prev, logoUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

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
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
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
              <div className={`mt-2 text-3xl font-black ${s.green ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>{s.v}</div>
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
            <TabsTrigger value="branding" className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold data-active:bg-white data-active:text-slate-900 data-active:shadow-sm dark:data-active:bg-slate-800 dark:data-active:text-white"><Building2 className="size-4" /> Branding</TabsTrigger>
            <TabsTrigger value="ai-provider" className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold data-active:bg-white data-active:text-slate-900 data-active:shadow-sm dark:data-active:bg-slate-800 dark:data-active:text-white"><Sparkles className="size-4" /> AI Provider</TabsTrigger>
          </TabsList>

          {/* GOOGLE TAB */}
          <TabsContent value="google">
            <div className="space-y-5">
              <article className="overflow-hidden rounded-3xl border border-blue-200/50 bg-gradient-to-br from-blue-50/90 via-purple-50/40 to-white dark:border-blue-400/15 dark:from-blue-400/5 dark:to-slate-900/50">
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(217,70,239,0.15)] dark:bg-slate-800"><GIcon c="size-6" /></span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">One-Click Google Connect</h3>
                      <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">Connect all Google services at once with a single OAuth sign-in.</p>
                    </div>
                  </div>
                  <Button size="lg" className="h-12 shrink-0 gap-2.5 rounded-[14px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(217,70,239,0.25)]"
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
                        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${s.isOn ? "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}><Icon className="size-5" /></span>
                        <div className="max-w-[480px]">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{s.name}</h3>
                            {s.isOn ? <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-400"><CheckCircle2 className="size-3" /> Connected</Badge> : <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Circle className="size-3" /> Not Connected</Badge>}
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
                    <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Smartphone className="size-[18px]" /></span>
                    <div><h3 className="m-0 text-base text-slate-900 dark:text-white">Progressive Web App</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Install on any device — works offline</p></div>
                  </div>
                  <Toggle checked={pwaOn} onChange={() => setPwaOn(!pwaOn)} />
                </header>
                {pwaOn && (
                  <div className="space-y-4 p-6">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-white shadow-sm dark:bg-slate-800"><Download className="size-5 text-blue-600 dark:text-blue-400" /></span>
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
                              <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"><f.i className="size-4" /></span>
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
                        {[["Name","QuasarAISEO"],["Display","Standalone"],["Theme","#d946ef"],["Icons","mainlogo.png"]].map(([k, v]) => (
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
                  <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Bell className="size-[18px]" /></span>
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
                    <span className={`grid size-9 place-items-center rounded-[12px] ${twoFAOn ? "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}><KeyRound className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Toggle checked={twoFAOn} onChange={() => handleToggle2FA(!twoFAOn)} />
                </header>
                {twoFAOn ? (
                  <div className="space-y-4 p-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4 dark:border-blue-400/15 dark:bg-blue-400/5">
                      <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400"><CheckCircle2 className="size-5" /></span>
                      <div>
                        <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">2FA is Active</h4>
                        <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">Your account is protected with authenticator app verification.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5"><Smartphone className="size-4 text-blue-600 dark:text-blue-400" /><h4 className="text-[13px] font-bold text-slate-900 dark:text-white">Authenticator App</h4></div>
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
                    <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Monitor className="size-[18px]" /></span>
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
                          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${d.current ? "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}><DIcon className="size-5" /></span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">{d.name}</h4>
                              {d.current && <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-400"><CheckCircle2 className="size-3" /> This device</Badge>}
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
                    <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Settings className="size-[18px]" /></span>
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

          {/* BRANDING TAB */}
          <TabsContent value="branding">
            <div className="space-y-5">
              {/* Header with Add button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Brand Profiles</h3>
                  <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">Create and manage brand identities for your content generation.</p>
                </div>
                {!showBrandingForm && (
                  <Button size="sm" className="gap-1.5" onClick={() => { resetBrandingForm(); setShowBrandingForm(true); }}>
                    <Plus className="size-4" /> Add Brand
                  </Button>
                )}
              </div>

              {/* Branding Form */}
              {showBrandingForm && (
                <article className={card}>
                  <header className={hdr}>
                    <div className="flex gap-2.75">
                      <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Building2 className="size-[18px]" /></span>
                      <div><h3 className="m-0 text-base text-slate-900 dark:text-white">{editingBranding ? "Edit Brand" : "New Brand"}</h3><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Fill in your company details</p></div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={resetBrandingForm}><X className="size-3.5" /> Cancel</Button>
                  </header>
                  <div className="space-y-4 p-6">
                    {/* Company Name + Website — side by side, only enabled fields */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Company Name *</label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                          value={brandingForm.companyName}
                          onChange={(e) => setBrandingForm({ ...brandingForm, companyName: e.target.value })}
                          placeholder="Acme Inc."
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Website *</label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                          value={brandingForm.website}
                          onChange={(e) => setBrandingForm({ ...brandingForm, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 -mt-2">
                      <p className="text-[11px] text-slate-400">{editingBranding ? "Edit any field below." : "Enter company name + website, then let AI fetch the rest."}</p>
                      {!editingBranding && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleExtractBrandInfo}
                          disabled={extractingBrand || !brandingForm.companyName.trim() || !(brandingForm.website ?? "").trim()}
                          className="gap-1.5"
                        >
                          {extractingBrand ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                          {extractingBrand ? "Fetching..." : "Fetch from Website"}
                        </Button>
                      )}
                    </div>

                    {/* Logo + Default Color — manually entered */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Logo</label>
                        <div className="flex items-center gap-3">
                          {brandingForm.logoUrl ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${brandingForm.logoUrl}`}
                              alt="Logo preview"
                              className="size-12 rounded-xl border border-slate-200 object-contain dark:border-white/10"
                            />
                          ) : (
                            <div className="grid size-12 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-white/10 dark:text-slate-500">
                              <Building2 className="size-5" />
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                              {logoUploading ? <><Loader2 className="size-3.5 animate-spin" /> Uploading...</> : <><Upload className="size-3.5" /> Upload Logo</>}
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml,image/webp"
                              className="hidden"
                              onChange={handleLogoUpload}
                              disabled={logoUploading}
                            />
                          </label>
                          {brandingForm.logoUrl && (
                            <Button size="xs" variant="outline" className="gap-1" onClick={() => setBrandingForm({ ...brandingForm, logoUrl: "" })}>
                              <X className="size-3" /> Remove
                            </Button>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-400">PNG, JPG, SVG, WebP — max 5MB</p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Default Color</label>
                        <div className="flex flex-wrap items-center gap-2">
                          {["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#1f2937"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setBrandingForm({ ...brandingForm, defaultColor: c })}
                              className={`size-8 rounded-full transition-all ${(brandingForm.defaultColor ?? "").toLowerCase() === c ? "ring-2 ring-offset-2 ring-fuchsia-500 scale-110 dark:ring-offset-slate-900" : "hover:scale-110"}`}
                              style={{ backgroundColor: c }}
                              aria-label={c}
                            />
                          ))}
                          <label className="relative grid size-8 cursor-pointer place-items-center rounded-full border border-dashed border-slate-300 transition hover:scale-110 dark:border-white/20">
                            <input
                              type="color"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              value={brandingForm.defaultColor}
                              onChange={(e) => setBrandingForm({ ...brandingForm, defaultColor: e.target.value })}
                            />
                            <span className="text-[10px] font-bold text-slate-400">+</span>
                          </label>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="size-5 rounded-md border border-slate-200 dark:border-white/10" style={{ backgroundColor: brandingForm.defaultColor }} />
                          <span className="text-[12px] font-mono text-slate-500 dark:text-slate-400">{brandingForm.defaultColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* All other fields — disabled for new brands (AI fills), editable when editing */}
                    <div className={`space-y-4 ${editingBranding ? "" : "opacity-40 pointer-events-none"}`}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Industry</label>
                          <IndustryCombobox
                            value={brandingForm.industry ?? ""}
                            onChange={(value) => setBrandingForm({ ...brandingForm, industry: value })}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Tagline</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            value={brandingForm.tagline}
                            onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                            placeholder={editingBranding ? "Enter tagline..." : "AI will fill this..."}
                            disabled={!editingBranding}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Description</label>
                        <textarea
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                          rows={2}
                          value={brandingForm.description}
                          onChange={(e) => setBrandingForm({ ...brandingForm, description: e.target.value })}
                          placeholder={editingBranding ? "Enter description..." : "AI will fill this..."}
                          disabled={!editingBranding}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Email</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            value={brandingForm.email}
                            onChange={(e) => setBrandingForm({ ...brandingForm, email: e.target.value })}
                            placeholder={editingBranding ? "contact@example.com" : "AI will fill this..."}
                            disabled={!editingBranding}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Phone</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            value={brandingForm.phone}
                            onChange={(e) => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                            placeholder={editingBranding ? "+1 234 567 890" : "AI will fill this..."}
                            disabled={!editingBranding}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Address</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            value={brandingForm.address}
                            onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                            placeholder={editingBranding ? "123 Main St, City, Country" : "AI will fill this..."}
                            disabled={!editingBranding}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Twitter / X</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            value={brandingForm.socialLinks?.twitter ?? ""}
                            onChange={(e) => setBrandingForm({ ...brandingForm, socialLinks: { ...brandingForm.socialLinks, twitter: e.target.value } })}
                            placeholder={editingBranding ? "@username" : "AI will fill this..."}
                            disabled={!editingBranding}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">LinkedIn</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            value={brandingForm.socialLinks?.linkedin ?? ""}
                            onChange={(e) => setBrandingForm({ ...brandingForm, socialLinks: { ...brandingForm.socialLinks, linkedin: e.target.value } })}
                            placeholder={editingBranding ? "company/link" : "AI will fill this..."}
                            disabled={!editingBranding}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Facebook</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            value={brandingForm.socialLinks?.facebook ?? ""}
                            onChange={(e) => setBrandingForm({ ...brandingForm, socialLinks: { ...brandingForm.socialLinks, facebook: e.target.value } })}
                            placeholder={editingBranding ? "page/name" : "AI will fill this..."}
                            disabled={!editingBranding}
                          />
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-400/20"
                        checked={brandingForm.isDefault ?? false}
                        onChange={(e) => setBrandingForm({ ...brandingForm, isDefault: e.target.checked })}
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set as default brand</span>
                    </label>

                    <div className="flex justify-end gap-2.5 pt-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={resetBrandingForm}>Cancel</Button>
                      <Button size="sm" className="gap-1.5" onClick={handleSaveBranding} disabled={brandingSaving || !brandingForm.companyName.trim() || !(brandingForm.website ?? "").trim()}>
                        {brandingSaving ? <><Loader2 className="size-3.5 animate-spin" /> {extractionStep || "Saving..."}</> : <><Sparkles className="size-3.5" /> {editingBranding ? "Update" : "Create & Fetch"}</>}
                      </Button>
                    </div>
                  </div>
                </article>
              )}

              {/* Branding List */}
              {brandingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-slate-400" />
                </div>
              ) : brandings.length === 0 ? (
                <article className={`${card} p-12 text-center`}>
                  <Building2 className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                  <h4 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">No brands yet</h4>
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">Create your first brand profile to get started.</p>
                  {!showBrandingForm && (
                    <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowBrandingForm(true)}>
                      <Plus className="size-4" /> Add Brand
                    </Button>
                  )}
                </article>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {brandings.map((b) => (
                    <article key={b.id} className={card}>
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black text-white"
                              style={{ backgroundColor: b.defaultColor }}
                            >
                              {b.companyName.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">{b.companyName}</h4>
                                {b.isDefault && (
                                  <Badge className="bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-400">
                                    <Star className="size-3" /> Default
                                  </Badge>
                                )}
                              </div>
                              {b.industry && <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{b.industry}</p>}
                            </div>
                          </div>
                        </div>

                        {b.description && <p className="mt-3 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{b.description}</p>}

                        {b.tagline && <p className="mt-2 text-[11px] italic text-slate-500 dark:text-slate-400">"{b.tagline}"</p>}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {b.website && <span className="flex items-center gap-1"><Link2 className="size-3" /> {b.website.replace(/^https?:\/\//, "")}</span>}
                          {b.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {b.email}</span>}
                          {b.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {b.phone}</span>}
                        </div>

                        {b.logoUrl && (
                          <div className="mt-3">
                            <img src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${b.logoUrl}`} alt={b.companyName} className="h-8 rounded-lg object-contain" />
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                          {!b.isDefault && (
                            <Button size="xs" variant="outline" className="gap-1" onClick={() => handleSetDefault(b)}>
                              <Star className="size-3" /> Set Default
                            </Button>
                          )}
                          <Button size="xs" variant="outline" className="gap-1" onClick={() => handleEditBranding(b)}>
                            <Pencil className="size-3" /> Edit
                          </Button>
                          <Button size="xs" variant="destructive" className="ml-auto gap-1" onClick={() => handleDeleteBranding(b.id)}>
                            <Trash2 className="size-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI PROVIDER TAB */}
          <TabsContent value="ai-provider">
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">AI Provider Settings</h3>
                <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">
                  Configure your own AI API key for content generation, audit reports, and agent tasks.
                  Your key is encrypted and stored securely. No WindsurfAPI dependency needed.
                </p>
              </div>

              {/* Current status */}
              {aiSettings && (
                <article className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-emerald-800 dark:text-emerald-300">
                        {aiSettings.provider === "openai" ? "OpenAI" : "OpenRouter"} is configured
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80">
                        Model: {aiSettings.defaultModel} · Key: {aiSettings.apiKeyPreview}
                      </p>
                    </div>
                    <Button size="xs" variant="outline" className="gap-1" onClick={handleDeleteAiProvider}>
                      <Trash2 className="size-3" /> Remove
                    </Button>
                  </div>
                </article>
              )}

              {/* Error / Success messages */}
              {aiError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                  <AlertCircle className="size-4 shrink-0" /> {aiError}
                </div>
              )}
              {aiSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" /> {aiSuccess}
                </div>
              )}

              {/* Provider selection */}
              <article className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
                <div className="space-y-5 p-6">
                  {/* Provider selector */}
                  <div>
                    <label className="mb-2 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">AI Provider</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAiProvider("openai");
                          setAiDefaultModel("gpt-4o");
                        }}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                          aiProvider === "openai"
                            ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-400/40 dark:bg-emerald-400/5"
                            : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                        }`}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white text-[14px] font-black">AI</span>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white">OpenAI</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">GPT-4o, GPT-4.1, o4-mini, etc.</p>
                        </div>
                        {aiProvider === "openai" && <CheckCircle2 className="ml-auto size-5 text-emerald-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiProvider("openrouter");
                          setAiDefaultModel("anthropic/claude-3.5-sonnet");
                        }}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                          aiProvider === "openrouter"
                            ? "border-purple-500 bg-purple-50/50 dark:border-purple-400/40 dark:bg-purple-400/5"
                            : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                        }`}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white text-[14px] font-black">OR</span>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white">OpenRouter</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">300+ models (Claude, GPT, Gemini, Llama, etc.)</p>
                        </div>
                        {aiProvider === "openrouter" && <CheckCircle2 className="ml-auto size-5 text-purple-600" />}
                      </button>
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      API Key {aiSettings?.hasApiKey && <span className="text-emerald-600">(configured — enter new key to replace)</span>}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={aiProvider === "openai" ? "sk-proj-..." : "sk-or-v1-..."}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        autoComplete="off"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {aiProvider === "openai"
                        ? "Get your API key from platform.openai.com/api-keys"
                        : "Get your API key from openrouter.ai/keys"}
                    </p>
                  </div>

                  {/* Default Model */}
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Default Model</label>
                    <input
                      type="text"
                      value={aiDefaultModel}
                      onChange={(e) => setAiDefaultModel(e.target.value)}
                      placeholder={aiProvider === "openai" ? "gpt-4o" : "anthropic/claude-3.5-sonnet"}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      This model will be used for /audit-mcp, /post-create, and other AI features. You can override per request.
                    </p>
                  </div>

                  {/* Test result */}
                  {aiTestResult && (
                    <div className={`flex items-center gap-2 rounded-xl border p-3 text-[12px] ${
                      aiTestResult.success
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400"
                    }`}>
                      {aiTestResult.success
                        ? <CheckCircle2 className="size-4 shrink-0" />
                        : <AlertCircle className="size-4 shrink-0" />}
                      {aiTestResult.message}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSaveAiProvider}
                      disabled={aiSaving || !aiApiKey.trim()}
                      className="gap-1.5"
                    >
                      {aiSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      {aiSaving ? "Saving..." : "Save Settings"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTestAiProvider}
                      disabled={aiTesting || !aiApiKey.trim()}
                      className="gap-1.5"
                    >
                      {aiTesting ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                      {aiTesting ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                </div>
              </article>

              {/* Info card */}
              <article className="rounded-2xl border border-blue-200/50 bg-blue-50/40 p-4 dark:border-blue-400/15 dark:bg-blue-400/5">
                <div className="flex gap-3">
                  <Sparkles className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-[12px] text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">How this works</p>
                    <ul className="mt-1.5 space-y-1">
                      <li>• Your API key is used for all AI features: /audit-mcp, /post-create, audit reports</li>
                      <li>• The key is encrypted with AES-256 before storing in the database</li>
                      <li>• Image generation still uses the server-level OpenAI key (gpt-image-2)</li>
                      <li>• You can switch between OpenAI and OpenRouter anytime</li>
                      <li>• OpenRouter gives you access to 300+ models from a single API</li>
                    </ul>
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
