"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, Plus, Search, X, ArrowLeft, Trash2 } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";
import { toast } from "sonner";

type Company = {
  id: string; name: string; sap_code: string; main_service: string | null; currency: "IQD"|"USD";
  total_due: number|string; total_paid: number|string; balance: number|string;
};

export default function CompaniesPage() {
  const { tr } = useLanguage();
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
    if (!user) { setError(tr("لازم تسجل دخول أولاً.","You need to sign in first.")); setSaving(false); return; }
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
      setError(insertError.message.includes("unique") ? tr("رقم SAP مستخدم مسبقاً.","SAP code is already in use.") : insertError.message);
    } else {
      setForm({ name:"", sap_code:"", main_service:"", currency:"IQD", phone:"", notes:"" });
      setShowForm(false);
      await load();
    }
    setSaving(false);
  };

  const filtered = companies.filter(c => (c.name+" "+c.sap_code+" "+(c.main_service??"")).toLowerCase().includes(query.toLowerCase()));

  const deleteCompany = async (company: Company) => {
    if (!window.confirm(tr("حذف هذه الشركة نهائياً؟","Delete this company permanently?"))) return;

    const { error: deleteError } = await supabasePersistent.rpc("spc_delete_company_safe", {
      p_company_id: company.id,
    });

    if (deleteError) {
      toast.error(
        deleteError.message.includes("HAS_MOVEMENTS")
          ? tr("هذه الشركة عليها حركات. احذف الحركات أولاً.","This company has movements. Delete its movements first.")
          : deleteError.message
      );
      return;
    }

    toast.success(tr("تم حذف الشركة.","Company deleted."));
    await load();
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black">{tr("الشركات","Companies")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tr("سجل كل شركة ورقم SAP والخدمة، وبعدها تابع حسابها.","Add each company, SAP code and service, then track its account.")}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 font-bold text-white hover:bg-brand-hover">
          <Plus size={18}/> {tr("إضافة شركة","Add Company")}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17}/>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr("ابحث عن شركة...","Search for a company...")} className="w-full rounded-2xl border border-border bg-surface py-3 pr-11 pl-4 outline-none focus:border-brand"/>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map(c => (
          <div key={c.id} className="relative rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link href={"/dashboard/companies/"+c.id} className="block">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-brand/10 p-3 text-brand"><Building2 size={21}/></div>
                  <div>
                    <h2 className="text-lg font-black">{c.name}</h2>
                    <p className="text-xs text-muted-foreground">SAP: {c.sap_code}</p>
                    <p className="mt-2 text-sm">{c.main_service || tr("بدون خدمة محددة","No service specified")}</p>
                  </div>
                </div>
                <ArrowLeft className="text-muted-foreground" size={18}/>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-4 text-center">
                <Mini label={tr("المطلوب","Due")} value={Number(c.total_due||0)} currency={c.currency}/>
                <Mini label={tr("المقبوض","Received")} value={Number(c.total_paid||0)} currency={c.currency}/>
                <Mini label={tr("الباقي","Remaining")} value={Number(c.balance||0)} currency={c.currency} bold/>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => void deleteCompany(c)}
              className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
              title={tr("حذف الشركة","Delete Company")}
            >
              <Trash2 size={14}/>
              {tr("حذف","Delete")}
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 className="text-xl font-black">{tr("إضافة شركة جديدة","Add New Company")}</h2><p className="text-sm text-muted-foreground">{tr("المعلومات الأساسية فقط، والباقي تضيفه لاحقاً.","Add the basic information now; you can complete the rest later.")}</p></div>
              <button type="button" onClick={()=>setShowForm(false)} className="rounded-xl p-2 hover:bg-surface-2"><X size={20}/></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={tr("اسم الشركة*","Company Name*")} value={form.name} onChange={v=>setForm({...form,name:v})} required/>
              <Field label={tr("رقم SAP*","SAP Code*")} value={form.sap_code} onChange={v=>setForm({...form,sap_code:v})} required/>
              <Field label={tr("الخدمة الرئيسية","Main Service")} value={form.main_service} onChange={v=>setForm({...form,main_service:v})}/>
              <div><label className="mb-2 block text-sm font-medium">{tr("العملة","Currency")}</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3"><option value="IQD">{tr("IQD - دينار عراقي","IQD - Iraqi Dinar")}</option><option value="USD">{tr("USD - دولار","USD - US Dollar")}</option></select></div>
              <Field label={tr("رقم الهاتف","Phone Number")} value={form.phone} onChange={v=>setForm({...form,phone:v})}/>
              <Field label={tr("ملاحظات","Notes")} value={form.notes} onChange={v=>setForm({...form,notes:v})}/>
            </div>
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button disabled={saving} className="mt-6 w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-60">{saving ? tr("جاري الحفظ...","Saving...") : tr("حفظ الشركة","Save Company")}</button>
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
