"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Hash, Save, WalletCards } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";

type InvoiceSettings = {
  user_id: string;
  company_name: string;
  invoice_prefix: string;
  default_currency: "IQD" | "USD";
  footer_note: string | null;
  payment_notes: string | null;
};

const defaults = {
  company_name: "SPC",
  invoice_prefix: "SPC-INV-",
  default_currency: "IQD" as "IQD" | "USD",
  footer_note: "",
  payment_notes: "",
};

export default function InvoiceSettingsPage() {
  const { tr } = useLanguage();
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const { data: auth, error: authError } = await supabasePersistent.auth.getUser();
      if (authError || !auth.user) {
        setError(tr("انتهت الجلسة. سجل دخول مرة ثانية.","Session expired. Please sign in again."));
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabasePersistent
        .from("spc_invoice_settings")
        .select("user_id,company_name,invoice_prefix,default_currency,footer_note,payment_notes")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (loadError) {
        setError(loadError.message);
      } else if (data) {
        const row = data as InvoiceSettings;
        setForm({
          company_name: row.company_name || "SPC",
          invoice_prefix: row.invoice_prefix || "SPC-INV-",
          default_currency: row.default_currency || "IQD",
          footer_note: row.footer_note || "",
          payment_notes: row.payment_notes || "",
        });
      }

      setLoading(false);
    };

    void load();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const { data: auth, error: authError } = await supabasePersistent.auth.getUser();
    if (authError || !auth.user) {
      setError(tr("انتهت الجلسة. سجل دخول مرة ثانية.","Session expired. Please sign in again."));
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabasePersistent
      .from("spc_invoice_settings")
      .upsert(
        {
          user_id: auth.user.id,
          company_name: form.company_name.trim() || "SPC",
          invoice_prefix: form.invoice_prefix.trim() || "SPC-INV-",
          default_currency: form.default_currency,
          footer_note: form.footer_note.trim() || null,
          payment_notes: form.payment_notes.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (saveError) setError(saveError.message);
    else setSaved(true);

    setSaving(false);
  };

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">{tr("جاري تحميل إعدادات الفواتير...","Loading invoice settings...")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{tr("إعدادات الفواتير","Invoice Settings")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tr("إعدادات خاصة بفواتير SPC.","SPC invoice settings.")}</p>
        </div>
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2">
          <ArrowRight size={17} />
          رجوع للإعدادات
        </Link>
      </div>

      {error && <div className="rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{error}</div>}
      {saved && <div className="rounded-2xl border border-success-border bg-success-soft p-4 text-sm text-success">{tr("تم حفظ إعدادات الفواتير ✓","Invoice settings saved ✓")}</div>}

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="text-brand" size={20} />
            <h2 className="text-lg font-black">{tr("بيانات الفاتورة","Invoice Details")}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={tr("اسم الشركة","Company Name")} value={form.company_name} onChange={(value) => setForm({...form,company_name:value})} />
            <Field label={tr("بادئة رقم الفاتورة","Invoice Number Prefix")} value={form.invoice_prefix} onChange={(value) => setForm({...form,invoice_prefix:value})} dir="ltr" />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <WalletCards className="text-brand" size={20} />
            <h2 className="text-lg font-black">{tr("العملة والملاحظات","Currency & Notes")}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">{tr("العملة الافتراضية","Default Currency")}</label>
              <select
                value={form.default_currency}
                onChange={(event) => setForm({...form,default_currency:event.target.value as "IQD" | "USD"})}
                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand"
              >
                <option value="IQD">{tr("IQD - دينار عراقي","IQD - Iraqi Dinar")}</option>
                <option value="USD">{tr("USD - دولار أمريكي","USD - US Dollar")}</option>
              </select>
            </div>
            <Field label={tr("ملاحظة أسفل الفاتورة","Invoice Footer Note")} value={form.footer_note} onChange={(value) => setForm({...form,footer_note:value})} />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium">{tr("ملاحظات الدفع","Payment Notes")}</label>
            <textarea
              value={form.payment_notes}
              onChange={(event) => setForm({...form,payment_notes:event.target.value})}
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-hover disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? tr("جاري الحفظ...","Saving...") : tr("حفظ إعدادات الفواتير","Save Invoice Settings")}
        </button>
      </form>
    </div>
  );
}

function Field({label,value,onChange,dir}:{label:string;value:string;onChange:(value:string)=>void;dir?:"ltr"|"rtl"}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        {label.includes("بادئة") && <Hash size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          dir={dir}
          className={"w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand " + (label.includes("بادئة") ? "pr-10" : "")}
        />
      </div>
    </div>
  );
}
