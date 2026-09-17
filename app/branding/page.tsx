"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  ChevronDown,
  Link2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMinLoading } from "@/lib/use-min-loading";
import { brandingApi, type Branding, type BrandingInput } from "@/lib/branding-api";

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance & Banking", "Education", "E-commerce & Retail",
  "Real Estate", "Manufacturing", "Marketing & Advertising", "Legal", "Hospitality & Tourism",
  "Construction", "Automotive", "Media & Entertainment", "Food & Beverage", "Agriculture",
  "Energy & Utilities", "Telecommunications", "Transportation & Logistics", "Insurance",
  "Consulting", "Non-profit", "Government", "Aerospace", "Pharmaceutical", "Fashion & Apparel",
  "Fitness & Wellness", "Gaming", "SaaS & Software", "AI & Automation",
];

const emptyBranding: BrandingInput = {
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
};

const card = "overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50";
const hdr = "flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5";

function IndustryCombobox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSearch(value), [value]);
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = INDUSTRIES.filter((industry) => industry.toLowerCase().includes(search.toLowerCase()));
  const showCreate = search && !INDUSTRIES.some((industry) => industry.toLowerCase() === search.toLowerCase());
  const select = (nextValue: string) => {
    setSearch(nextValue);
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm text-slate-900 transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white">
        <span className={value ? "text-slate-900 dark:text-white" : "text-slate-400"}>{value || "Select or type an industry..."}</span>
        <ChevronDown className={`size-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-800">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900/50">
            <Search className="size-4 text-slate-400" />
            <input autoFocus className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" value={search} onChange={(event) => { setSearch(event.target.value); onChange(event.target.value); }} placeholder="Search or type industry..." />
          </div>
          <div className="mt-1 max-h-52 overflow-y-auto rounded-lg">
            {filtered.length === 0 && !showCreate && <div className="px-3 py-2 text-xs text-slate-400">No results</div>}
            {filtered.map((industry) => (
              <button key={industry} type="button" onClick={() => select(industry)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-fuchsia-50 dark:hover:bg-fuchsia-400/10 ${value === industry ? "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400" : "text-slate-700 dark:text-slate-200"}`}>
                {industry}
              </button>
            ))}
            {showCreate && (
              <button type="button" onClick={() => select(search)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-fuchsia-700 transition hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-400/10">
                Use "{search}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrandingPage() {
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const showBrandingSkeleton = useMinLoading(brandingLoading, 800);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [extractingBrand, setExtractingBrand] = useState(false);
  const [extractionStep, setExtractionStep] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [showBrandingForm, setShowBrandingForm] = useState(false);
  const [editingBranding, setEditingBranding] = useState<Branding | null>(null);
  const [brandingForm, setBrandingForm] = useState<BrandingInput>(emptyBranding);
  const [error, setError] = useState<string | null>(null);

  const fetchBrandings = useCallback(async () => {
    setBrandingLoading(true);
    try {
      setBrandings(await brandingApi.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branding");
    } finally {
      setBrandingLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrandings(); }, [fetchBrandings]);

  const resetBrandingForm = () => {
    setBrandingForm(emptyBranding);
    setEditingBranding(null);
    setShowBrandingForm(false);
  };

  const handleEditBranding = (branding: Branding) => {
    setEditingBranding(branding);
    setBrandingForm({
      companyName: branding.companyName,
      description: branding.description,
      website: branding.website,
      defaultColor: branding.defaultColor,
      logoUrl: branding.logoUrl ?? "",
      industry: branding.industry,
      tagline: branding.tagline,
      email: branding.email,
      phone: branding.phone,
      address: branding.address,
      socialLinks: branding.socialLinks,
      isDefault: branding.isDefault,
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
        const extracted = await brandingApi.extractFromWebsite(brandingForm.companyName.trim(), (brandingForm.website ?? "").trim());
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
      if (editingBranding) await brandingApi.update(editingBranding.id, formData);
      else await brandingApi.create(formData);
      await fetchBrandings();
      resetBrandingForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding");
    } finally {
      setBrandingSaving(false);
      setExtractionStep("");
    }
  };

  const handleDeleteBranding = async (id: string) => {
    try {
      await brandingApi.delete(id);
      await fetchBrandings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branding");
    }
  };

  const handleSetDefault = async (branding: Branding) => {
    try {
      await brandingApi.update(branding.id, { isDefault: true });
      await fetchBrandings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default branding");
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
      const extracted = await brandingApi.extractFromWebsite(brandingForm.companyName.trim(), (brandingForm.website ?? "").trim());
      setBrandingForm((current) => ({
        ...current,
        industry: extracted.industry ?? current.industry,
        tagline: extracted.tagline ?? current.tagline,
        description: extracted.description ?? current.description,
        email: extracted.email ?? current.email,
        phone: extracted.phone ?? current.phone,
        address: extracted.address ?? current.address,
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const logoUrl = await brandingApi.uploadLogo(file);
      setBrandingForm((current) => ({ ...current, logoUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="px-6 py-8 lg:px-8">
          <section className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/80 bg-fuchsia-50/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-300">
              <Building2 className="size-3.5" /> Brand identity
            </div>
            <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">Branding</h1>
            <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">Create and manage brand identities for your content generation.</p>
          </section>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
              <AlertCircle className="size-4.5 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Brand Profiles</h3>
                <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">Create and manage brand identities for your content generation.</p>
              </div>
              {!showBrandingForm && (
                <Button size="sm" className="gap-1.5" onClick={() => { resetBrandingForm(); setShowBrandingForm(true); }}><Plus className="size-4" /> Add Brand</Button>
              )}
            </div>

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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Company Name *</label>
                      <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.companyName} onChange={(event) => setBrandingForm({ ...brandingForm, companyName: event.target.value })} placeholder="Acme Inc." />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Website *</label>
                      <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.website} onChange={(event) => setBrandingForm({ ...brandingForm, website: event.target.value })} placeholder="https://example.com" />
                    </div>
                  </div>
                  <div className="-mt-2 flex items-center gap-3">
                    <p className="text-[11px] text-slate-400">{editingBranding ? "Edit any field below." : "Enter company name + website, then let AI fetch the rest."}</p>
                    {!editingBranding && (
                      <Button size="sm" variant="outline" onClick={handleExtractBrandInfo} disabled={extractingBrand || !brandingForm.companyName.trim() || !(brandingForm.website ?? "").trim()} className="gap-1.5">
                        {extractingBrand ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{extractingBrand ? "Fetching..." : "Fetch from Website"}
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Logo</label>
                      <div className="flex items-center gap-3">
                        {brandingForm.logoUrl ? (
                          <img src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${brandingForm.logoUrl}`} alt="Logo preview" className="size-12 rounded-xl border border-slate-200 object-contain dark:border-white/10" />
                        ) : (
                          <div className="grid size-12 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-white/10 dark:text-slate-500"><Building2 className="size-5" /></div>
                        )}
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                            {logoUploading ? <><Loader2 className="size-3.5 animate-spin" /> Uploading...</> : <><Upload className="size-3.5" /> Upload Logo</>}
                          </span>
                          <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                        </label>
                        {brandingForm.logoUrl && <Button size="xs" variant="outline" className="gap-1" onClick={() => setBrandingForm({ ...brandingForm, logoUrl: "" })}><X className="size-3" /> Remove</Button>}
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400">PNG, JPG, SVG, WebP — max 5MB</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Default Color</label>
                      <div className="flex flex-wrap items-center gap-2">
                        {["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#1f2937"].map((color) => (
                          <button key={color} type="button" onClick={() => setBrandingForm({ ...brandingForm, defaultColor: color })} className={`size-8 rounded-full transition-all ${(brandingForm.defaultColor ?? "").toLowerCase() === color ? "scale-110 ring-2 ring-fuchsia-500 ring-offset-2 dark:ring-offset-slate-900" : "hover:scale-110"}`} style={{ backgroundColor: color }} aria-label={color} />
                        ))}
                        <label className="relative grid size-8 cursor-pointer place-items-center rounded-full border border-dashed border-slate-300 transition hover:scale-110 dark:border-white/20">
                          <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={brandingForm.defaultColor} onChange={(event) => setBrandingForm({ ...brandingForm, defaultColor: event.target.value })} />
                          <span className="text-[10px] font-bold text-slate-400">+</span>
                        </label>
                      </div>
                      <div className="mt-2 flex items-center gap-2"><div className="size-5 rounded-md border border-slate-200 dark:border-white/10" style={{ backgroundColor: brandingForm.defaultColor }} /><span className="text-[12px] font-mono text-slate-500 dark:text-slate-400">{brandingForm.defaultColor}</span></div>
                    </div>
                  </div>

                  <div className={`space-y-4 ${editingBranding ? "" : "pointer-events-none opacity-40"}`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Industry</label><IndustryCombobox value={brandingForm.industry ?? ""} onChange={(value) => setBrandingForm({ ...brandingForm, industry: value })} /></div>
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Tagline</label><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.tagline} onChange={(event) => setBrandingForm({ ...brandingForm, tagline: event.target.value })} placeholder={editingBranding ? "Enter tagline..." : "AI will fill this..."} disabled={!editingBranding} /></div>
                    </div>
                    <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Description</label><textarea className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" rows={2} value={brandingForm.description} onChange={(event) => setBrandingForm({ ...brandingForm, description: event.target.value })} placeholder={editingBranding ? "Enter description..." : "AI will fill this..."} disabled={!editingBranding} /></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Email</label><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.email} onChange={(event) => setBrandingForm({ ...brandingForm, email: event.target.value })} placeholder={editingBranding ? "contact@example.com" : "AI will fill this..."} disabled={!editingBranding} /></div>
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Phone</label><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.phone} onChange={(event) => setBrandingForm({ ...brandingForm, phone: event.target.value })} placeholder={editingBranding ? "+1 234 567 890" : "AI will fill this..."} disabled={!editingBranding} /></div>
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Address</label><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.address} onChange={(event) => setBrandingForm({ ...brandingForm, address: event.target.value })} placeholder={editingBranding ? "123 Main St, City, Country" : "AI will fill this..."} disabled={!editingBranding} /></div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Twitter / X</label><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.socialLinks?.twitter ?? ""} onChange={(event) => setBrandingForm({ ...brandingForm, socialLinks: { ...brandingForm.socialLinks, twitter: event.target.value } })} placeholder={editingBranding ? "@username" : "AI will fill this..."} disabled={!editingBranding} /></div>
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">LinkedIn</label><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.socialLinks?.linkedin ?? ""} onChange={(event) => setBrandingForm({ ...brandingForm, socialLinks: { ...brandingForm.socialLinks, linkedin: event.target.value } })} placeholder={editingBranding ? "company/link" : "AI will fill this..."} disabled={!editingBranding} /></div>
                      <div><label className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Facebook</label><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white" value={brandingForm.socialLinks?.facebook ?? ""} onChange={(event) => setBrandingForm({ ...brandingForm, socialLinks: { ...brandingForm.socialLinks, facebook: event.target.value } })} placeholder={editingBranding ? "page/name" : "AI will fill this..."} disabled={!editingBranding} /></div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5"><input type="checkbox" className="size-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-400/20" checked={brandingForm.isDefault ?? false} onChange={(event) => setBrandingForm({ ...brandingForm, isDefault: event.target.checked })} /><span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set as default brand</span></label>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={resetBrandingForm}>Cancel</Button>
                    <Button size="sm" className="gap-1.5" onClick={handleSaveBranding} disabled={brandingSaving || !brandingForm.companyName.trim() || !(brandingForm.website ?? "").trim()}>
                      {brandingSaving ? <><Loader2 className="size-3.5 animate-spin" /> {extractionStep || "Saving..."}</> : <><Sparkles className="size-3.5" /> {editingBranding ? "Update" : "Create & Fetch"}</>}
                    </Button>
                  </div>
                </div>
              </article>
            )}

            {showBrandingSkeleton ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-lg" /><div className="flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="mt-1.5 h-3 w-48" /></div><Skeleton className="h-8 w-16 rounded-lg" /></div><div className="mt-3 space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div></div>
                ))}
              </div>
            ) : brandings.length === 0 ? (
              <article className={`${card} p-12 text-center`}><Building2 className="mx-auto size-10 text-slate-300 dark:text-slate-600" /><h4 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">No brands yet</h4><p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">Create your first brand profile to get started.</p>{!showBrandingForm && <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowBrandingForm(true)}><Plus className="size-4" /> Add Brand</Button>}</article>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {brandings.map((branding) => (
                  <article key={branding.id} className={card}>
                    <div className="p-5">
                      <div className="flex items-start justify-between"><div className="flex items-center gap-3">
                        {branding.logoUrl ? <img src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${branding.logoUrl}`} alt={branding.companyName} className="size-11 shrink-0 rounded-xl object-contain" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black text-white" style={{ backgroundColor: branding.defaultColor }}>{branding.companyName.charAt(0).toUpperCase()}</span>}
                        <div><div className="flex items-center gap-2"><h4 className="text-[14px] font-bold text-slate-900 dark:text-white">{branding.companyName}</h4>{branding.isDefault && <Badge className="bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-400"><Star className="size-3" /> Default</Badge>}</div>{branding.industry && <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{branding.industry}</p>}</div>
                      </div></div>
                      {branding.description && <p className="mt-3 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{branding.description}</p>}
                      {branding.tagline && <p className="mt-2 text-[11px] italic text-slate-500 dark:text-slate-400">"{branding.tagline}"</p>}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{branding.website && <span className="flex items-center gap-1"><Link2 className="size-3" /> {branding.website.replace(/^https?:\/\//, "")}</span>}{branding.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {branding.email}</span>}{branding.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {branding.phone}</span>}</div>
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/5">{!branding.isDefault && <Button size="xs" variant="outline" className="gap-1" onClick={() => handleSetDefault(branding)}><Star className="size-3" /> Set Default</Button>}<Button size="xs" variant="outline" className="gap-1" onClick={() => handleEditBranding(branding)}><Pencil className="size-3" /> Edit</Button><Button size="xs" variant="destructive" className="ml-auto gap-1" onClick={() => handleDeleteBranding(branding.id)}><Trash2 className="size-3" /> Delete</Button></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
