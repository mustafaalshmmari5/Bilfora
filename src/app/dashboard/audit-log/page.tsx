"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, History, Search } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";

type Log={id:number;entity_type:"receivable"|"payment";action:"insert"|"update"|"delete";before_data:any;after_data:any;created_at:string;};
export default function AuditLogPage(){
  const {tr}=useLanguage(); const [rows,setRows]=useState<Log[]>([]); const [q,setQ]=useState(""); const [loading,setLoading]=useState(true);
  useEffect(()=>{void (async()=>{const {data}=await supabasePersistent.from("spc_audit_logs").select("id,entity_type,action,before_data,after_data,created_at").order("created_at",{ascending:false}).limit(500);setRows((data??[]) as Log[]);setLoading(false);})();},[]);
  const filtered=useMemo(()=>{const t=q.trim().toLowerCase();if(!t)return rows;return rows.filter(r=>JSON.stringify(r.after_data??r.before_data??{}).toLowerCase().includes(t));},[rows,q]);
  const label=(r:Log)=>r.entity_type==="receivable"?tr("استحقاق","Receivable"):tr("قبض","Payment");
  const action=(r:Log)=>r.action==="insert"?tr("إضافة","Added"):r.action==="update"?tr("تعديل","Edited"):tr("حذف","Deleted");
  return <div className="mx-auto max-w-6xl space-y-6 pb-10">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black">{tr("سجل التغييرات","Audit Log")}</h1><p className="mt-2 text-sm text-muted-foreground">{tr("تاريخ إضافة وتعديل وحذف الحركات.","History of movement creation, edits and deletions.")}</p></div><Link href="/dashboard/settings" className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-bold"><ArrowRight size={17}/>{tr("رجوع للإعدادات","Back to Settings")}</Link></div>
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm"><div className="relative"><Search size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={tr("ابحث داخل السجل...","Search audit log...")} className="input pr-11"/></div></div>
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">{loading?<div className="p-12 text-center text-muted-foreground">{tr("جاري التحميل...","Loading...")}</div>:filtered.length===0?<div className="p-12 text-center text-muted-foreground"><History className="mx-auto mb-3" size={32}/>{tr("ماكو تغييرات مسجلة بعد.","No audit entries yet.")}</div>:<div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead className="bg-surface-2 text-muted-foreground"><tr><th className="p-4 text-right">{tr("الوقت","Time")}</th><th className="p-4 text-right">{tr("الحركة","Movement")}</th><th className="p-4 text-right">{tr("الإجراء","Action")}</th><th className="p-4 text-right">{tr("البيان","Details")}</th><th className="p-4 text-right">{tr("المبلغ","Amount")}</th></tr></thead><tbody className="divide-y divide-border">{filtered.map(r=>{const d=r.after_data??r.before_data??{};return <tr key={r.id}><td className="p-4" dir="ltr">{new Date(r.created_at).toLocaleString("en-GB")}</td><td className="p-4 font-bold">{label(r)}</td><td className="p-4">{action(r)}</td><td className="p-4">{d.service_name??d.payment_method??"—"}</td><td className="p-4 font-black" dir="ltr">{d.amount??"—"}</td></tr>})}</tbody></table></div>}</div>
  </div>;
}
