"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Moon, Palette, ReceiptText, Save, Sun, User, ArrowLeft } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { applyAccentColor } from "@/lib/appearance";
import { useLanguage } from "@/lib/language";

const PRESETS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#475569",
];

function applyTheme(mode: "light" | "dark") {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem("spc-theme", mode);
}

export default function SettingsPage() {
  const { tr } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState("#0f766e");

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabasePersistent.auth.getUser();
      if (!auth.user) {
        setError(tr("تعذر تحميل الحساب.","Unable to load account."));
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabasePersistent
        .from("profiles")
        .select("full_name, accent_color, theme_mode")
        .eq("id", auth.user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const nextTheme = (data?.theme_mode === "dark" ? "dark" : "light") as "light" | "dark";
      const nextAccent = data?.accent_color || "#0f766e";
      setName(data?.full_name || "");
      setTheme(nextTheme);
      setAccent(nextAccent);
      applyTheme(nextTheme);
      applyAccentColor(nextAccent);
      setLoading(false);
    };

    load();
  }, []);

  const chooseTheme = (mode: "light" | "dark") => {
    setTheme(mode);
    applyTheme(mode);
    setSaved(false);
  };

  const chooseAccent = (color: string) => {
    setAccent(color);
    applyAccentColor(color);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const { data: auth } = await supabasePersistent.auth.getUser();
    if (!auth.user) {
      setError(tr("انتهت الجلسة. سجل دخول مرة ثانية.","Session expired. Please sign in again."));
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabasePersistent
      .from("profiles")
      .update({ accent_color: accent, theme_mode: theme })
      .eq("id", auth.user.id);

    if (updateError) setError(updateError.message);
    else setSaved(true);

    setSaving(false);
  };

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">{tr("جاري تحميل الإعدادات...","Loading settings...")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-black">{tr("الإعدادات","Settings")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tr("خصّص شكل نظام حسابات SPC حسب ذوقك.","Customize the SPC Accounts System appearance.")}</p>
      </div>

      {error && <div className="rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{error}</div>}
      {saved && <div className="rounded-2xl border border-success-border bg-success-soft p-4 text-sm text-success">{tr("تم حفظ إعدادات المظهر لحسابك ✓","Appearance settings saved ✓")}</div>}

      <Link
        href="/dashboard/invoices-settings"
        className="group flex items-center justify-between rounded-3xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-soft p-3 text-brand"><ReceiptText size={21} /></div>
          <div>
            <h2 className="font-black">{tr("الفواتير","Invoices")}</h2>
            <p className="text-sm text-muted-foreground">{tr("كل الفواتير المرفقة ويا حركات المستحقات بمكان واحد.","All invoices attached to receivable movements in one place.")}</p>
          </div>
        </div>
        <ArrowLeft size={19} className="text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-brand" />
      </Link>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-soft p-3 text-brand"><User size={21} /></div>
          <div>
            <h2 className="font-black">{name || tr("المستخدم","User")}</h2>
            <p className="text-sm text-muted-foreground">{tr("إعدادات المظهر الخاصة بحسابك","Your account appearance settings")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Moon className="text-brand" size={20} />
          <div>
            <h2 className="text-lg font-black">{tr("الوضع","Theme")}</h2>
            <p className="text-sm text-muted-foreground">{tr("اختار نهاري أو ليلي.","Choose light or dark mode.")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => chooseTheme("light")}
            className={"flex items-center justify-center gap-2 rounded-2xl border p-4 font-bold transition " + (theme === "light" ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface-2")}
          >
            <Sun size={19} /> {tr("نهاري","Light")}
          </button>
          <button
            onClick={() => chooseTheme("dark")}
            className={"flex items-center justify-center gap-2 rounded-2xl border p-4 font-bold transition " + (theme === "dark" ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface-2")}
          >
            <Moon size={19} /> {tr("ليلي","Dark")}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Palette className="text-brand" size={20} />
          <div>
            <h2 className="text-lg font-black">{tr("لون النظام","System Color")}</h2>
            <p className="text-sm text-muted-foreground">{tr("اختار لون جاهز أو حدد أي لون يعجبك.","Choose a preset color or pick your own.")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => chooseAccent(color)}
              className="relative h-12 w-12 rounded-2xl border-2 border-surface shadow-sm ring-1 ring-border transition hover:scale-105"
              style={{ backgroundColor: color }}
              title={color}
            >
              {accent.toLowerCase() === color.toLowerCase() && (
                <Check className="absolute inset-0 m-auto text-white drop-shadow" size={21} />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-sm font-medium">{tr("لون مخصص","Custom Color")}</label>
          <input
            type="color"
            value={accent}
            onChange={(e) => chooseAccent(e.target.value)}
            className="h-12 w-20 cursor-pointer rounded-xl border border-border bg-surface-2 p-1"
          />
          <input
            value={accent}
            onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setAccent(e.target.value)}
            onBlur={() => /^#[0-9A-Fa-f]{6}$/.test(accent) && applyAccentColor(accent)}
            className="w-32 rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-sm"
            dir="ltr"
          />
          <div className="h-10 flex-1 rounded-xl" style={{ backgroundColor: accent }} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          اللون المختار يغيّر هوية النظام فقط. ألوان التحذير والتأخير والمقبوض تبقى ثابتة حتى تكون القراءة المالية واضحة.
        </p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-hover disabled:opacity-60"
      >
        <Save size={18} />
        {saving ? tr("جاري الحفظ...","Saving...") : tr("حفظ المظهر","Save Appearance")}
      </button>
    </div>
  );
}
