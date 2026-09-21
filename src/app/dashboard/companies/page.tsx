"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, Plus, Search, X, ArrowLeft } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";

type Company = {
  id: string; name: string; sap_code: string; main_service: string | null; currency: "IQD"|"USD";
  total_due: number|string; total_paid: number|string; balance: number|string;
};

export default function CompaniesPage() {
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", sap_code:"", main_service:"", currency:"IQD", phone:"", notes:"" });

  const load = async () => {
    const { data } = await supabasePersistent.from("spc_company_balances").select("*").order("name");
    setCompanies((data ?? []) as Company[]);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    const { data: userData } = await supabasePersistent.auth.getUser();
    const user = userData.user;
    if (!user) { setError("لازم تسجل دخول أولاً."); setSaving(false); return; }
    const { error: insertError } = await supabasePersistent.from("spc_companies").insert({
      created_by: user.id,
      name: form.name.trim(),
      sap_code: form.sap_code.trim(),
      main_service: form.main_service.trim() || null,
      currency: form.currency,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    });
    if (insertError) {
      setError(insertError.message.includes("unique") ? "رقم SAP مستخدم مسبقاً." : insertError.message);
    } else {
      setForm({ name:"", sap_code:"", main_service:"", currency:"IQD", phone:"", notes:"" });
      setShowForm(false);
      await load();
    }
    setSaving(false);
  };

  const filtered = companies.filter(c => (c.name+" "+c.sap_code+" "+(c.main_service??"")).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black">الشركات</h1>
          <p className="mt-2 text-sm text-muted-foreground">سجل كل شركة ورقم SAP والخدمة، وبعدها تابع حسابها.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 font-bold text-white hover:bg-brand-hover">
          <Plus size={18}/> إضافة شركة
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17}/>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن شركة..." className="w-full rounded-2xl border border-border bg-surface py-3 pr-11 pl-4 outline-none focus:border-brand"/>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map(c => (
          <Link key={c.id} href={"/dashboard/companies/"+c.id} className="rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="rounded-2xl bg-brand/10 p-3 text-brand"><Building2 size={21}/></div>
                <div>
                  <h2 className="text-lg font-black">{c.name}</h2>
                  <p className="text-xs text-muted-foreground">SAP: {c.sap_code}</p>
                  <p className="mt-2 text-sm">{c.main_service || "بدون خدمة محددة"}</p>
                </div>
              </div>
              <ArrowLeft className="text-muted-foreground" size={18}/>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-4 text-center">
              <Mini label="المطلوب" value={Number(c.total_due||0)} currency={c.currency}/>
              <Mini label="المقبوض" value={Number(c.total_paid||0)} currency={c.currency}/>
              <Mini label="الباقي" value={Number(c.balance||0)} currency={c.currency} bold/>
            </div>
          </Link>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 className="text-xl font-black">إضافة شركة جديدة</h2><p className="text-sm text-muted-foreground">المعلومات الأساسية فقط، والباقي تضيفه لاحقاً.</p></div>
              <button type="button" onClick={()=>setShowForm(false)} className="rounded-xl p-2 hover:bg-surface-2"><X size={20}/></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="اسم الشركة*" value={form.name} onChange={v=>setForm({...form,name:v})} required/>
              <Field label="رقم SAP*" value={form.sap_code} onChange={v=>setForm({...form,sap_code:v})} required/>
              <Field label="الخدمة الرئيسية" value={form.main_service} onChange={v=>setForm({...form,main_service:v})}/>
              <div><label className="mb-2 block text-sm font-medium">العملة</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3"><option value="IQD">IQD - دينار عراقي</option><option value="USD">USD - دولار</option></select></div>
              <Field label="رقم الهاتف" value={form.phone} onChange={v=>setForm({...form,phone:v})}/>
              <Field label="ملاحظات" value={form.notes} onChange={v=>setForm({...form,notes:v})}/>
            </div>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button disabled={saving} className="mt-6 w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-60">{saving ? "جاري الحفظ..." : "حفظ الشركة"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({label,value,onChange,required}:{label:string;value:string;onChange:(v:string)=>void;required?:boolean}) {
  return <div><label className="mb-2 block text-sm font-medium">{label}</label><input required={required} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand"/></div>;
}
function Mini({label,value,currency,bold}:{label:string;value:number;currency:string;bold?:boolean}) {
  return <div><p className="text-[11px] text-muted-foreground">{label}</p><p className={"mt-1 text-sm "+(bold?"font-black text-brand":"font-bold")}>{new Intl.NumberFormat("en-US",{maximumFractionDigits:currency==="IQD"?0:2}).format(value)} <span className="text-[9px]">{currency}</span></p></div>;
}
