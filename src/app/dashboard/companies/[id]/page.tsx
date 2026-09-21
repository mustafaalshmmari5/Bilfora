"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, Plus, BanknoteArrowDown, BellRing, X } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import CompanySwitcher from "@/components/dashboard/CompanySwitcher";
import { useLanguage } from "@/lib/language";

type Company = {
  id:string; name:string; sap_code:string; main_service:string|null; currency:"IQD"|"USD";
  total_due:number|string; total_paid:number|string; balance:number|string; phone:string|null; notes:string|null;
};
type Ledger = {
  id:string; entry_type:"receivable"|"payment"; entry_date:string; description:string; reference_number:string|null;
  notes:string|null; amount:number|string; balance_after:number|string;
};

export default function CompanyAccountPage() {
  const params = useParams<{id:string}>();
  const id = params.id;
  const [company,setCompany]=useState<Company|null>(null);
  const [ledger,setLedger]=useState<Ledger[]>([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState<"due"|"payment"|"reminder"|null>(null);
  const { tr } = useLanguage();

  const load = async () => {
    const [c,l] = await Promise.all([
      supabasePersistent.from("spc_company_balances").select("*").eq("id",id).single(),
      supabasePersistent.from("spc_account_ledger").select("*").eq("company_id",id).order("entry_date",{ascending:false}).order("created_at",{ascending:false})
    ]);
    if (!c.error) setCompany(c.data as Company);
    if (!l.error) setLedger((l.data??[]) as Ledger[]);
    setLoading(false);
  };
  useEffect(()=>{ if(id) load(); },[id]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">{tr("جاري تحميل الحساب...", "Loading account...")}</div>;
  if (!company) return <div className="p-10 text-center">{tr("الشركة غير موجودة.", "Company not found.")}</div>;

  const fmt=(v:number|string)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:company.currency==="IQD"?0:2}).format(Number(v||0))+" "+company.currency;

  return (
    <div className="space-y-6 pb-10 pt-14 md:pt-12">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start"><Link href="/dashboard/companies" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand"><ArrowRight size={16}/> {tr("رجوع للشركات", "Back to companies")}</Link><div className="w-full sm:w-auto"><CompanySwitcher currentCompanyId={id} /></div></div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-brand/10 p-4 text-brand"><Building2 size={28}/></div>
            <div>
              <h1 className="text-3xl font-black">{company.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{tr("رقم SAP:", "SAP No.:")} <span className="font-bold text-foreground"><LatinNumber>{company.sap_code}</LatinNumber></span></p>
              <p className="mt-1 text-sm text-muted-foreground">{tr("الخدمة:", "Service:")} <span className="font-medium text-foreground">{company.main_service||"—"}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Action onClick={()=>setModal("due")} icon={Plus} label={tr("إضافة استحقاق","Add receivable")}/>
            <Action onClick={()=>setModal("payment")} icon={BanknoteArrowDown} label={tr("تسجيل قبض","Record payment")} primary/>
            <Action onClick={()=>setModal("reminder")} icon={BellRing} label={tr("تذكير","Reminder")}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BalanceCard label={tr("إجمالي المطلوب","Total due")} value={fmt(company.total_due)} />
        <BalanceCard label={tr("إجمالي المقبوض","Total received")} value={fmt(company.total_paid)} success />
        <BalanceCard label={tr("الباقي الحالي","Current balance")} value={fmt(company.balance)} warning={Number(company.balance)>0} />
      </div>

      <div className="rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">{tr("كشف الحساب", "Account statement")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("كل استحقاق يزيد الرصيد، وكل قبض ينقصه مباشرة.", "Each receivable increases the balance, and each payment reduces it immediately.")}</p>
        </div>
        {ledger.length===0 ? (
          <div className="p-12 text-center text-muted-foreground">{tr("ماكو حركات بعد. أضف أول استحقاق.", "No movements yet. Add the first receivable.")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr><th className="p-4 text-right">{tr("التاريخ","Date")}</th><th className="p-4 text-right">{tr("نوع الحركة","Type")}</th><th className="p-4 text-right">{tr("البيان","Description")}</th><th className="p-4 text-right">{tr("المرجع","Reference")}</th><th className="p-4 text-right">{tr("المبلغ","Amount")}</th><th className="p-4 text-right">{tr("الرصيد بعد الحركة","Balance after")}</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map(row=>(
                  <tr key={row.id} className="hover:bg-surface-2">
                    <td className="p-4"><LatinNumber>{row.entry_date}</LatinNumber></td>
                    <td className="p-4"><span className={"rounded-full px-3 py-1 text-xs font-bold "+(row.entry_type==="payment"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>{row.entry_type==="payment"?tr("قبض","Payment"):tr("استحقاق","Receivable")}</span></td>
                    <td className="p-4 font-medium">{row.description}</td>
                    <td className="p-4 text-muted-foreground">{row.reference_number?<LatinNumber>{row.reference_number}</LatinNumber>:"—"}</td>
                    <td className={"p-4 font-black "+(row.entry_type==="payment"?"text-emerald-600":"text-foreground")}><LatinNumber>{row.entry_type==="payment"?"- ":"+ "}{fmt(row.amount)}</LatinNumber></td>
                    <td className="p-4 font-black"><LatinNumber>{fmt(row.balance_after)}</LatinNumber></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <EntryModal kind={modal} companyId={id} currency={company.currency} onClose={()=>setModal(null)} onSaved={async()=>{setModal(null);await load();}} />}
    </div>
  );
}

function EntryModal({kind,companyId,currency,onClose,onSaved}:{kind:"due"|"payment"|"reminder";companyId:string;currency:string;onClose:()=>void;onSaved:()=>void}) {
  const { tr } = useLanguage();
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const today=new Date().toISOString().slice(0,10);
  const [amount,setAmount]=useState(""); const [service,setService]=useState(""); const [date,setDate]=useState(today); const [dueDate,setDueDate]=useState("");
  const [reference,setReference]=useState(""); const [notes,setNotes]=useState(""); const [method,setMethod]=useState(tr("تحويل","Transfer")); const [title,setTitle]=useState(tr("متابعة تحصيل","Collection follow-up"));

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setSaving(true);setError("");
    const {data}=await supabasePersistent.auth.getUser(); const user=data.user;
    if(!user){setError(tr("انتهت الجلسة. سجل دخول مرة ثانية.","Session expired. Please sign in again."));setSaving(false);return;}
    let result;
    if(kind==="due") result=await supabasePersistent.from("spc_receivables").insert({company_id:companyId,created_by:user.id,service_name:service,amount:Number(amount),issue_date:date,due_date:dueDate||null,reference_number:reference||null,notes:notes||null});
    else if(kind==="payment") result=await supabasePersistent.from("spc_payments").insert({company_id:companyId,created_by:user.id,amount:Number(amount),payment_date:date,payment_method:method,reference_number:reference||null,notes:notes||null});
    else result=await supabasePersistent.from("spc_reminders").insert({company_id:companyId,created_by:user.id,remind_on:date,title,notes:notes||null});
    if(result.error)setError(result.error.message); else onSaved();
    setSaving(false);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">{kind==="due"?tr("إضافة استحقاق","Add receivable"):kind==="payment"?tr("تسجيل قبض","Record payment"):tr("إضافة تذكير","Add reminder")}</h2><p className="text-sm text-muted-foreground">{kind==="due"?tr("يزيد الرصيد تلقائياً","Increases the balance automatically"):kind==="payment"?tr("ينقص من الرصيد مباشرة","Reduces the balance immediately"):tr("حتى ما تنسى المتابعة","So you do not miss the follow-up")}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-surface-2"><X size={20}/></button></div>
      <div className="space-y-4">
        {kind==="due"&&<Input label={tr("الخدمة / البيان*","Service / Description*")} value={service} onChange={setService} required/>}
        {kind!=="reminder"&&<Input label={tr("المبلغ","Amount")+" ("+currency+")*"} value={amount} onChange={setAmount} type="number" required/>}
        {kind==="payment"&&<Input label={tr("طريقة القبض","Payment method")} value={method} onChange={setMethod}/>}
        {kind==="reminder"&&<Input label={tr("عنوان التذكير","Reminder title")} value={title} onChange={setTitle}/>}
        <Input label={kind==="reminder"?tr("تاريخ التذكير","Reminder date"):tr("تاريخ الحركة","Movement date")} value={date} onChange={setDate} type="date" required/>\n        {kind==="due"&&<Input label={tr("تاريخ الاستحقاق","Due date")} value={dueDate} onChange={setDueDate} type="date"/>}
        {kind!=="reminder"&&<Input label={tr("رقم المرجع (اختياري)","Reference number (optional)")} value={reference} onChange={setReference}/>}
        <Input label={tr("ملاحظات","Notes")} value={notes} onChange={setNotes}/>
      </div>
      {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="mt-6 w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-60">{saving?tr("جاري الحفظ...","Saving..."):tr("حفظ الحركة","Save movement")}</button>
    </form>
  </div>;
}
function Input({label,value,onChange,type="text",required}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}) {return <div><label className="mb-2 block text-sm font-medium">{label}</label><input required={required} min={type==="number"?"0.01":undefined} step={type==="number"?"0.01":undefined} type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand"/></div>}
function Action({onClick,icon:Icon,label,primary}:{onClick:()=>void;icon:any;label:string;primary?:boolean}) {return <button onClick={onClick} className={"inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold "+(primary?"bg-brand text-white":"border border-border bg-surface-2 hover:bg-surface-inset")}><Icon size={17}/>{label}</button>}
function LatinNumber({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <bdi lang="en" dir="ltr" className={className} style={{fontFamily:"Arial, Helvetica, sans-serif",fontVariantNumeric:"lining-nums tabular-nums",fontFeatureSettings:'"locl" 0'}}>{children}</bdi>;
}
function BalanceCard({label,value,success,warning}:{label:string;value:string;success?:boolean;warning?:boolean}) {return <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className={"mt-2 text-2xl font-black "+(success?"text-emerald-600":warning?"text-amber-600":"")}><LatinNumber>{value}</LatinNumber></p></div>}
