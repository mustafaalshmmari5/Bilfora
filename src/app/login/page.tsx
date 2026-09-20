"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { getAuthErrorMessage } from "@/utils/error-handling";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabasePersistent.auth.signInWithPassword({
      email: email.trim(),
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
    <main className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <img src="/spc-logo.svg" alt="SPC - Solution Portal Company" className="h-auto w-[190px] object-contain" />
        </div>

        <div className="rounded-3xl border border-border bg-surface p-7 shadow-xl">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-black text-foreground">تسجيل الدخول</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ادخل إلى حسابات الشركات والمتابعة المالية.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-border bg-surface-2 py-3.5 pr-11 pl-4 outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border bg-surface-2 py-3.5 pr-11 pl-11 outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="إظهار كلمة المرور"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-brand py-3.5 font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <Link href="/register" className="text-sm font-medium text-brand hover:underline">
              إنشاء أول حساب للنظام
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
