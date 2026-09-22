"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, KeyRound, Loader2, Mail, Shield, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/auth-api";

const card = "overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50";
const hdr = "flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5";
const field =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

function Notice({ tone, text }: { tone: "ok" | "err"; text: string }) {
  return (
    <p className={`text-[12px] font-semibold ${tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
      {text}
    </p>
  );
}

export function AccountSecurity() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setCompany(user?.company ?? "");
  }, [user?.name, user?.email, user?.company]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const roleLabel = user?.role === "super" ? "Super user" : "User";

  async function saveProfile() {
    setProfileNotice(null);
    const nextName = name.trim();
    const nextEmail = email.trim();
    if (!nextName) {
      setProfileNotice({ tone: "err", text: "Please enter your name." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setProfileNotice({ tone: "err", text: "Please enter a valid email address." });
      return;
    }

    setProfileSaving(true);
    try {
      const result = await authApi.updateProfile({
        name: nextName,
        email: nextEmail,
        company: company.trim(),
      });
      updateUser(result.user);
      setProfileNotice({ tone: "ok", text: "Account details saved." });
    } catch (error) {
      setProfileNotice({
        tone: "err",
        text: error instanceof Error ? error.message : "Could not save account details.",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePassword() {
    setPasswordNotice(null);
    if (!currentPassword) {
      setPasswordNotice({ tone: "err", text: "Enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice({ tone: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ tone: "err", text: "New passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice({ tone: "ok", text: "Password updated." });
    } catch (error) {
      setPasswordNotice({
        tone: "err",
        text: error instanceof Error ? error.message : "Could not update password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <>
      <article className={card}>
        <header className={hdr}>
          <div className="flex gap-2.75">
            <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400">
              <UserRound className="size-[18px]" />
            </span>
            <div>
              <h3 className="m-0 text-base text-slate-900 dark:text-white">Account</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Name, email, and company on this account</p>
            </div>
          </div>
        </header>
        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Name</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">
              <Mail className="size-3.5" /> Email
            </span>
            <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">
              <Building2 className="size-3.5" /> Company
            </span>
            <input className={field} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" placeholder="Optional" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveProfile} disabled={profileSaving} className="gap-1.5">
              {profileSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Save account
            </Button>
            {profileNotice && <Notice tone={profileNotice.tone} text={profileNotice.text} />}
          </div>
        </div>
      </article>

      <article className={card}>
        <header className={hdr}>
          <div className="flex gap-2.75">
            <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400">
              <KeyRound className="size-[18px]" />
            </span>
            <div>
              <h3 className="m-0 text-base text-slate-900 dark:text-white">Password</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Change the password you use to sign in</p>
            </div>
          </div>
        </header>
        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Current password</span>
            <input className={field} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">New password</span>
              <input className={field} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase text-slate-500 dark:text-slate-400">Confirm new password</span>
              <input className={field} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={savePassword} disabled={passwordSaving} className="gap-1.5">
              {passwordSaving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Update password
            </Button>
            {passwordNotice && <Notice tone={passwordNotice.tone} text={passwordNotice.text} />}
          </div>
        </div>
      </article>

      <article className={card}>
        <header className={hdr}>
          <div className="flex gap-2.75">
            <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400">
              <Shield className="size-[18px]" />
            </span>
            <div>
              <h3 className="m-0 text-base text-slate-900 dark:text-white">Account details</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Role and when this account was created</p>
            </div>
          </div>
        </header>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Role</p>
            <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-white">{roleLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Member since</p>
            <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-white">{memberSince}</p>
          </div>
        </div>
      </article>
    </>
  );
}
