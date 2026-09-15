"use client"

import { FormEvent, Suspense, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, TriangleAlert } from "lucide-react"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { authApi } from "@/lib/auth-api"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordLoading() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
      <AuthBrandPanel />
      <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.08),transparent_40%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_50%,#fff_100%)] px-4 sm:px-8 py-10 sm:py-16">
        <div className="flex items-center gap-2.5 text-slate-400">
          <Loader2 className="size-5 animate-spin" /> Loading...
        </div>
      </div>
    </div>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [success, setSuccess] = useState(false)

  // No token in URL
  if (!token) {
    return (
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
        <AuthBrandPanel />
        <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.08),transparent_40%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_50%,#fff_100%)] px-4 sm:px-8 py-10 sm:py-16">
          <Link href="/" className="mb-8 flex items-center gap-2.5 text-[19px] font-black tracking-[-0.035em] lg:hidden">
            <span className="grid size-9.5 place-items-center rounded-[13px] border border-blue-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.35)]">
              <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={26} height={26} className="size-full object-contain" priority />
            </span>
            <span className="text-slate-950 font-black">
              Quasar<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
            </span>
          </Link>
          <div className="w-full max-w-[420px]">
            <div className="mb-5 flex items-center gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
              <TriangleAlert className="size-4.5 shrink-0" /> Invalid reset link. No token was provided.
            </div>
            <p className="text-[14px] text-slate-500">
              <Link href="/forgot-password" className="font-bold text-blue-600 hover:text-blue-700">
                Request a new password reset link
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  function validateClientSide(pwd: string, confirm: string): { password?: string; confirm?: string } {
    const errors: { password?: string; confirm?: string } = {}
    if (!pwd) {
      errors.password = "Password is required."
    } else if (pwd.length < 8) {
      errors.password = "Password must be at least 8 characters."
    }
    if (!confirm) {
      errors.confirm = "Please confirm your password."
    } else if (pwd !== confirm) {
      errors.confirm = "Passwords do not match."
    }
    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const clientErrors = validateClientSide(password, confirmPassword)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setLoading(true)

    try {
      await authApi.resetPassword(token!, password)
      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch (err) {
      if (authApi.isAuthApiError(err)) {
        if (err.status === 400 && /password/i.test(err.message)) {
          setFieldErrors({ password: err.message })
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
      <AuthBrandPanel />
      <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.08),transparent_40%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_50%,#fff_100%)] px-4 sm:px-8 py-10 sm:py-16">
        <Link href="/" className="mb-8 flex items-center gap-2.5 text-[19px] font-black tracking-[-0.035em] lg:hidden">
          <span className="grid size-9.5 place-items-center rounded-[13px] border border-blue-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.35)]">
            <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={26} height={26} className="size-full object-contain" priority />
          </span>
          <span className="text-slate-950 font-black">
            Quasar<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
          </span>
        </Link>

        <div className="w-full max-w-[420px]">
          {success ? (
            <>
              {/* Success state */}
              <div className="mb-8">
                <div className="mb-5 grid size-16 place-items-center rounded-full bg-green-100">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <h1 className="text-[clamp(28px,4vw,36px)] font-black leading-[1.05] tracking-[-0.05em] text-slate-950">
                  Password reset.
                </h1>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500">
                  Your password has been reset successfully. Redirecting you to sign in...
                </p>
              </div>
              <Link
                href="/login"
                className="flex h-13 items-center justify-center gap-2.5 rounded-[15px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-sm font-bold text-white shadow-[0_14px_32px_rgba(217,70,239,0.25)] transition-transform hover:-translate-y-px"
              >
                Sign in now <ArrowRight className="size-4.5" />
              </Link>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-[clamp(30px,4vw,40px)] font-black leading-[1.05] tracking-[-0.05em] text-slate-950">
                  Set new password.
                </h1>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500">
                  Enter your new password below. Make it strong and unique.
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
                  <span className="block text-[13px] font-bold text-slate-700">New password</span>
                  <div className="relative mt-2.25">
                    <Lock className="absolute left-3.75 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`h-13 w-full rounded-[14px] border bg-white px-11 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 ${
                        fieldErrors.password
                          ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                          : "border-slate-200 focus:border-blue-400/65 focus:ring-blue-500/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.75 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-red-600">
                      <TriangleAlert className="size-3.5" /> {fieldErrors.password}
                    </span>
                  )}
                </label>

                <label>
                  <span className="block text-[13px] font-bold text-slate-700">Confirm new password</span>
                  <div className="relative mt-2.25">
                    <Lock className="absolute left-3.75 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`h-13 w-full rounded-[14px] border bg-white px-11 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 ${
                        fieldErrors.confirm
                          ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                          : "border-slate-200 focus:border-blue-400/65 focus:ring-blue-500/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.75 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  </div>
                  {fieldErrors.confirm && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-red-600">
                      <TriangleAlert className="size-3.5" /> {fieldErrors.confirm}
                    </span>
                  )}
                </label>

                {/* Password strength indicator */}
                {password.length > 0 && !fieldErrors.password && (
                  <div className="flex items-center gap-2">
                    {[...Array(4)].map((_, i) => {
                      const strength = Math.min(4, Math.floor(password.length / 2))
                      const colors = ["bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"]
                      const labels = ["Weak", "Fair", "Good", "Strong"]
                      return (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < strength ? colors[strength - 1] : "bg-slate-200"
                          }`}
                        />
                      )
                    })}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1.5 flex h-13 items-center justify-center gap-2.5 rounded-[15px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-sm font-bold text-white shadow-[0_14px_32px_rgba(217,70,239,0.25)] transition-transform hover:-translate-y-px disabled:opacity-70"
                >
                  {loading ? (
                    <><Loader2 className="size-4.5 animate-spin" /> Resetting password...</>
                  ) : (
                    <>Reset password <ArrowRight className="size-4.5" /></>
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-[14px] text-slate-500">
                <Link href="/login" className="font-bold text-blue-600 transition-colors hover:text-blue-700">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
