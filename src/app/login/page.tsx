"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Box,
  CircleDot,
  Eye,
  EyeOff,
  Lock,
  PieChart,
  Plus,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { getAuthErrorMessage } from "@/utils/error-handling";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (username.trim().toLowerCase() !== "mustafa321") {
      setError("اسم المستخدم غير صحيح.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabasePersistent.auth.signInWithPassword({
      email: "mustafaalshmmari5@gmail.com",
      password,
    });

    if (signInError) {
      setError(getAuthErrorMessage(signInError));
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface-2">
      <ThemeToggle compact className="fixed left-4 top-4 z-30 shadow-lg" />

      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#5b14b7] via-[#43158c] to-[#0d3773] p-10 text-white lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-24 top-16 h-72 w-72 rounded-full border border-white/30" />
            <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full border border-cyan-300/30" />
            <div className="absolute bottom-0 left-0 right-0 h-[42%] bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:42px_42px] [transform:perspective(500px)_rotateX(62deg)_scale(1.35)] [transform-origin:bottom]" />
          </div>

          <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
            <div className="relative mb-9">
              <div className="absolute -left-32 -top-10 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
                <BarChart3 size={38} />
              </div>
              <div className="absolute -right-32 top-14 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
                <TrendingUp size={38} />
              </div>
              <div className="absolute -left-28 top-32 rounded-full border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
                <PieChart size={34} />
              </div>

              <div className="flex items-center justify-center gap-4">
                <CircleDot className="h-20 w-20" strokeWidth={1.6} />
                <span className="text-7xl font-light tracking-tight">SPC</span>
              </div>
            </div>

            <h1 className="max-w-lg text-3xl font-black leading-[1.55] md:text-4xl">
              شركة بوابة الحلول المبتكرة
              <br />
              للشركات والمتابعات المالية
            </h1>

            <div className="mt-12 flex items-center gap-8 text-white/75">
              <Box size={28} />
              <Plus size={26} />
              <div className="h-11 w-11 rotate-45 rounded-xl border border-white/30 bg-white/10" />
              <div className="flex items-end gap-1.5">
                <span className="h-4 w-3 rounded-sm bg-white/50" />
                <span className="h-7 w-3 rounded-sm bg-white/70" />
                <span className="h-10 w-3 rounded-sm bg-white" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center bg-background px-5 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-7 flex justify-center">
              <img
                src="/spc-logo.svg"
                alt="SPC - Solution Portal Company"
                className="h-auto w-[180px] object-contain"
              />
            </div>

            <div className="rounded-[28px] border border-border bg-surface p-7 shadow-2xl sm:p-8">
              <div className="mb-7 text-center">
                <h2 className="text-3xl font-black text-foreground">تسجيل الدخول</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  ادخل إلى حسابات الشركات والمتابعة المالية.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold">اسم المستخدم</label>
                  <div className="relative">
                    <UserRound
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="text"
                      name="spc-login-user"
                      required
                      autoComplete="off"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-surface-2 py-3.5 pr-11 pl-4 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">كلمة المرور</label>
                  <div className="relative">
                    <Lock
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-surface-2 py-3.5 pr-11 pl-11 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label="إظهار كلمة المرور"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-brand py-3.5 text-base font-black text-white shadow-lg shadow-brand/20 transition hover:bg-brand-hover disabled:opacity-60"
                >
                  {loading ? "جاري الدخول..." : "دخول"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
