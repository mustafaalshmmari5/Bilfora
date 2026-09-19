"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { supabasePersistent } from "@/lib/supabase-clients";
import { getAuthErrorMessage } from "@/utils/error-handling";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error: signUpError } = await supabasePersistent.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${location.origin}/confirmed`,
        data: {
          full_name: name.trim(),
          account_type: "individual",
        },
      },
    });

    if (signUpError) {
      setError(getAuthErrorMessage(signUpError));
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setMessage("تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلاً، افتح رسالة التفعيل ثم سجّل الدخول.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo size={24} />
        </div>

        <div className="rounded-3xl border border-border bg-surface p-7 shadow-xl">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-black">إنشاء حساب النظام</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              حساب داخلي للوصول إلى حسابات الشركات.
            </p>
          </div>

          {error && <div className="mb-5 rounded-2xl bg-red-50 p-3 text-center text-sm text-red-600">{error}</div>}
          {message && <div className="mb-5 rounded-2xl bg-emerald-50 p-3 text-center text-sm text-emerald-700">{message}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">الاسم</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full rounded-2xl border border-border bg-surface-2 py-3.5 pr-11 pl-4 outline-none focus:border-brand"
                />
              </div>
            </div>

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
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 خانات على الأقل"
                  className="w-full rounded-2xl border border-border bg-surface-2 py-3.5 pr-11 pl-11 outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-brand py-3.5 font-bold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <Link href="/login" className="text-sm font-medium text-brand hover:underline">
              عندك حساب؟ تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
