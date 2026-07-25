"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, TriangleAlert } from "lucide-react"

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { useAuth } from "@/hooks/use-auth"
import { authApi } from "@/lib/auth-api"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [authLoading, isAuthenticated, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      const message = authApi.isAuthApiError(err) ? err.message : "Something went wrong. Please try again."
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
      {/* Left: Brand panel (desktop only) */}
      <AuthBrandPanel />

      {/* Right: Login form */}
      <div className="relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.08),transparent_40%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_50%,#fff_100%)] px-4 sm:px-8 py-10 sm:py-16">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 text-[19px] font-black tracking-[-0.035em] lg:hidden">
          <span className="grid size-9.5 place-items-center rounded-[13px] border border-fuchsia-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.35)]">
            <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={26} height={26} className="size-full object-contain" priority />
          </span>
          <span className="text-slate-950 font-black">
            Quasar<span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
          </span>
        </Link>

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[clamp(30px,4vw,40px)] font-black leading-[1.05] tracking-[-0.05em] text-slate-950">
              Welcome back.
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500">
              Sign in to your QuasarAISEO workspace to continue running audits.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600">
              <TriangleAlert className="size-4.5 shrink-0" /> {error}
            </div>
          )}

          {/* Social auth */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <svg className="size-4.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <svg className="size-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.009-.866-.014-1.699-2.782.602-3.369-1.34-3.369-1.34-.455-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.349-1.087.635-1.337-2.22-.252-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.252-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.57 9.57 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.395.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.679.919.679 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Or continue with email</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid gap-4.5">
            <label>
              <span className="block text-[13px] font-bold text-slate-700">Email address</span>
              <div className="relative mt-2.25">
                <Mail className="absolute left-3.75 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  className="h-13 w-full rounded-[14px] border border-slate-200 bg-white px-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-fuchsia-400/65 focus:ring-4 focus:ring-fuchsia-500/10"
                />
              </div>
            </label>

            <label>
              <span className="flex items-center justify-between text-[13px] font-bold text-slate-700">
                Password
                <Link href="#" className="text-[12px] font-semibold text-fuchsia-600 hover:text-fuchsia-700">
                  Forgot password?
                </Link>
              </span>
              <div className="relative mt-2.25">
                <Lock className="absolute left-3.75 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="h-13 w-full rounded-[14px] border border-slate-200 bg-white px-11 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-fuchsia-400/65 focus:ring-4 focus:ring-fuchsia-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.75 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                name="remember"
                className="size-4.5 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500/20"
              />
              <span className="text-[13px] font-semibold text-slate-600">Keep me signed in for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1.5 flex h-13 items-center justify-center gap-2.5 rounded-[15px] bg-gradient-to-br from-fuchsia-600 via-purple-600 to-pink-500 text-sm font-bold text-white shadow-[0_14px_32px_rgba(217,70,239,0.25)] transition-transform hover:-translate-y-px disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 className="size-4.5 animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="size-4.5" /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-7 text-center text-[14px] text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold text-fuchsia-600 transition-colors hover:text-fuchsia-700">
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
