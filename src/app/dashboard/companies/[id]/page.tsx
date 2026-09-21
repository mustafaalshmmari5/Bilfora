"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, Plus, BanknoteArrowDown, BellRing, X } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import CompanySwitcher from "@/components/dashboard/CompanySwitcher";

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

  if (loading) return <div className="p-10 text-center text-muted-foreground">جاري تحميل الحساب...</div>;
  if (!company) return <div className="p-10 text-center">الشركة غير موجودة.</div>;

  const fmt=(v:number|string)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:company.currency==="IQD"?0:2}).format(Number(v||0))+" "+company.currency;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard/companies" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand"><ArrowRight size={16}/> رجوع للشركات</Link><CompanySwitcher currentCompanyId={id} /></div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-brand/10 p-4 text-brand"><Building2 size={28}/></div>
            <div>
              <h1 className="text-3xl font-black">{company.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">رقم SAP: <span className="font-bold text-foreground"><LatinNumber>{company.sap_code}</LatinNumber></span></p>
              <p className="mt-1 text-sm text-muted-foreground">الخدمة: <span className="font-medium text-foreground">{company.main_service||"—"}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Action onClick={()=>setModal("due")} icon={Plus} label="إضافة استحقاق"/>
            <Action onClick={()=>setModal("payment")} icon={BanknoteArrowDown} label="تسجيل قبض" primary/>
            <Action onClick={()=>setModal("reminder")} icon={BellRing} label="تذكير"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BalanceCard label="إجمالي المطلوب" value={fmt(company.total_due)} />
        <BalanceCard label="إجمالي المقبوض" value={fmt(company.total_paid)} success />
        <BalanceCard label="الباقي الحالي" value={fmt(company.balance)} warning={Number(company.balance)>0} />
      </div>

      <div className="rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">كشف الحساب</h2>
          <p className="mt-1 text-sm text-muted-foreground">كل استحقاق يزيد الرصيد، وكل قبض ينقصه مباشرة.</p>
        </div>
        {ledger.length===0 ? (
          <div className="p-12 text-center text-muted-foreground">ماكو حركات بعد. أضف أول استحقاق.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr><th className="p-4 text-right">التاريخ</th><th className="p-4 text-right">نوع الحركة</th><th className="p-4 text-right">البيان</th><th className="p-4 text-right">المرجع</th><th className="p-4 text-right">المبلغ</th><th className="p-4 text-right">الرصيد بعد الحركة</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map(row=>(
                  <tr key={row.id} className="hover:bg-surface-2">
                    <td className="p-4"><LatinNumber>{row.entry_date}</LatinNumber></td>
                    <td className="p-4"><span className={"rounded-full px-3 py-1 text-xs font-bold "+(row.entry_type==="payment"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>{row.entry_type==="payment"?"قبض":"استحقاق"}</span></td>
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
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const today=new Date().toISOString().slice(0,10);
  const [amount,setAmount]=useState(""); const [service,setService]=useState(""); const [date,setDate]=useState(today); const [dueDate,setDueDate]=useState("");
  const [reference,setReference]=useState(""); const [notes,setNotes]=useState(""); const [method,setMethod]=useState("تحويل"); const [title,setTitle]=useState("متابعة تحصيل");

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setSaving(true);setError("");
    const {data}=await supabasePersistent.auth.getUser(); const user=data.user;
    if(!user){setError("انتهت الجلسة. سجل دخول مرة ثانية.");setSaving(false);return;}
    let result;
    if(kind==="due") result=await supabasePersistent.from("spc_receivables").insert({company_id:companyId,created_by:user.id,service_name:service,amount:Number(amount),issue_date:date,due_date:dueDate||null,reference_number:reference||null,notes:notes||null});
    else if(kind==="payment") result=await supabasePersistent.from("spc_payments").insert({company_id:companyId,created_by:user.id,amount:Number(amount),payment_date:date,payment_method:method,reference_number:reference||null,notes:notes||null});
    else result=await supabasePersistent.from("spc_reminders").insert({company_id:companyId,created_by:user.id,remind_on:date,title,notes:notes||null});
    if(result.error)setError(result.error.message); else onSaved();
    setSaving(false);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">{kind==="due"?"إضافة استحقاق":kind==="payment"?"تسجيل قبض":"إضافة تذكير"}</h2><p className="text-sm text-muted-foreground">{kind==="due"?"يزيد الرصيد تلقائياً":kind==="payment"?"ينقص من الرصيد مباشرة":"حتى ما تنسى المتابعة"}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-surface-2"><X size={20}/></button></div>
      <div className="space-y-4">
        {kind==="due"&&<Input label="الخدمة / البيان*" value={service} onChange={setService} required/>}
        {kind!=="reminder"&&<Input label={"المبلغ ("+currency+")*"} value={amount} onChange={setAmount} type="number" required/>}
        {kind==="payment"&&<Input label="طريقة القبض" value={method} onChange={setMethod}/>}
        {kind==="reminder"&&<Input label="عنوان التذكير" value={title} onChange={setTitle}/>}
        <Input label={kind==="reminder"?"تاريخ التذكير":"تاريخ الحركة"} value={date} onChange={setDate} type="date" required/>\n        {kind==="due"&&<Input label="تاريخ الاستحقاق" value={dueDate} onChange={setDueDate} type="date"/>}
        {kind!=="reminder"&&<Input label="رقم المرجع (اختياري)" value={reference} onChange={setReference}/>}
        <Input label="ملاحظات" value={notes} onChange={setNotes}/>
      </div>
      {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="mt-6 w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-60">{saving?"جاري الحفظ...":"حفظ الحركة"}</button>
    </form>
  </div>;
}
function Input({label,value,onChange,type="text",required}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}) {return <div><label className="mb-2 block text-sm font-medium">{label}</label><input required={required} min={type==="number"?"0.01":undefined} step={type==="number"?"0.01":undefined} type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand"/></div>}
function Action({onClick,icon:Icon,label,primary}:{onClick:()=>void;icon:any;label:string;primary?:boolean}) {return <button onClick={onClick} className={"inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold "+(primary?"bg-brand text-white":"border border-border bg-surface-2 hover:bg-surface-inset")}><Icon size={17}/>{label}</button>}
function LatinNumber({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <bdi lang="en" dir="ltr" className={className} style={{fontFamily:"Arial, Helvetica, sans-serif",fontVariantNumeric:"lining-nums tabular-nums",fontFeatureSettings:'"locl" 0'}}>{children}</bdi>;
}
function BalanceCard({label,value,success,warning}:{label:string;value:string;success?:boolean;warning?:boolean}) {return <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className={"mt-2 text-2xl font-black "+(success?"text-emerald-600":warning?"text-amber-600":"")}><LatinNumber>{value}</LatinNumber></p></div>}
