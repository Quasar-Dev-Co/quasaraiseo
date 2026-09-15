"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, TriangleAlert } from "lucide-react"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { authApi } from "@/lib/auth-api"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFieldError(null)

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setFieldError("Email is required.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldError("Please enter a valid email address.")
      return
    }

    setLoading(true)

    try {
      const result = await authApi.forgotPassword(trimmedEmail)
      setSubmitted(true)
      if (result.devResetLink) {
        setDevResetLink(result.devResetLink)
      }
    } catch (err) {
      if (authApi.isAuthApiError(err)) {
        if (err.status === 400 && /email/i.test(err.message)) {
          setFieldError(err.message)
        } else {
          setError(err.message)
        }
      } else if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Cannot reach the server. Check your connection and try again.")
      } else {
        setError("Something went wrong. Please try again.")
      }
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
      {/* Left: Brand panel (desktop only) */}
      <AuthBrandPanel />

      {/* Right: Form */}
      <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.08),transparent_40%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_50%,#fff_100%)] px-4 sm:px-8 py-10 sm:py-16">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 text-[19px] font-black tracking-[-0.035em] lg:hidden">
          <span className="grid size-9.5 place-items-center rounded-[13px] border border-blue-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.35)]">
            <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={26} height={26} className="size-full object-contain" priority />
          </span>
          <span className="text-slate-950 font-black">
            Quasar<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
          </span>
        </Link>

        <div className="w-full max-w-[420px]">
          {submitted ? (
            <>
              {/* Success state */}
              <div className="mb-8">
                <div className="mb-5 grid size-16 place-items-center rounded-full bg-green-100">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <h1 className="text-[clamp(28px,4vw,36px)] font-black leading-[1.05] tracking-[-0.05em] text-slate-950">
                  Check your email.
                </h1>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500">
                  We've sent a password reset link to <strong className="text-slate-700">{email}</strong>.
                  Click the link in the email to reset your password. The link expires in 30 minutes.
                </p>
              </div>

              {devResetLink && (
                <div className="mb-5 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3.5">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-amber-700">Dev mode — no SMTP configured</p>
                  <p className="mt-1.5 text-[13px] text-amber-600">Reset link (would be emailed in production):</p>
                  <p className="mt-1.5 break-all rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-amber-800 border border-amber-200">
                    {devResetLink}
                  </p>
                  <Link
                    href={devResetLink.replace(/^https?:\/\/[^/]+/, "")}
                    className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-amber-700 hover:text-amber-800"
                  >
                    Open reset page <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-2 text-[14px] text-slate-500">
                <Link href="/login" className="inline-flex items-center gap-1.5 font-bold text-blue-600 transition-colors hover:text-blue-700">
                  <ArrowLeft className="size-4" /> Back to sign in
                </Link>
              </div>

              <p className="mt-6 text-[13px] text-slate-400">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setLoading(false) }}
                  className="font-bold text-blue-600 hover:text-blue-700"
                >
                  try again
                </button>
                .
              </p>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-[clamp(30px,4vw,40px)] font-black leading-[1.05] tracking-[-0.05em] text-slate-950">
                  Forgot password?
                </h1>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500">
                  No worries. Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-5 flex items-center gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
                  <TriangleAlert className="size-4.5 shrink-0" /> {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="grid gap-4.5" noValidate>
                <label>
                  <span className="block text-[13px] font-bold text-slate-700">Email address</span>
                  <div className="relative mt-2.25">
                    <Mail className="absolute left-3.75 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`h-13 w-full rounded-[14px] border bg-white px-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 ${
                        fieldError
                          ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                          : "border-slate-200 focus:border-blue-400/65 focus:ring-blue-500/10"
                      }`}
                    />
                  </div>
                  {fieldError && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-red-600">
                      <TriangleAlert className="size-3.5" /> {fieldError}
                    </span>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1.5 flex h-13 items-center justify-center gap-2.5 rounded-[15px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-sm font-bold text-white shadow-[0_14px_32px_rgba(217,70,239,0.25)] transition-transform hover:-translate-y-px disabled:opacity-70"
                >
                  {loading ? (
                    <><Loader2 className="size-4.5 animate-spin" /> Sending link...</>
                  ) : (
                    <>Send reset link <ArrowRight className="size-4.5" /></>
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="mt-7 text-center text-[14px] text-slate-500">
                Remember your password?{" "}
                <Link href="/login" className="font-bold text-blue-600 transition-colors hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
