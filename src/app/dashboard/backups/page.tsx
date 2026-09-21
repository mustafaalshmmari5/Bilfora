"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, DatabaseBackup, Download } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";
type Backup={id:number;backup_date:string;payload:any;created_at:string};
export default function BackupsPage(){
 const {tr}=useLanguage(); const [rows,setRows]=useState<Backup[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{void (async()=>{const {data}=await supabasePersistent.from("spc_daily_backups").select("id,backup_date,payload,created_at").order("backup_date",{ascending:false}).limit(30);setRows((data??[]) as Backup[]);setLoading(false);})();},[]);
 const download=(r:Backup)=>{const blob=new Blob([JSON.stringify(r.payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="SPC-backup-"+r.backup_date+".json";a.click();URL.revokeObjectURL(url);};
 return <div className="mx-auto max-w-4xl space-y-6 pb-10">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black">{tr("النسخ الاحتياطية","Backups")}</h1><p className="mt-2 text-sm text-muted-foreground">{tr("نسخة تلقائية يومية محفوظة لمدة 30 يوم.","Automatic daily snapshot retained for 30 days.")}</p></div><Link href="/dashboard/settings" className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-bold"><ArrowRight size={17}/>{tr("رجوع للإعدادات","Back to Settings")}</Link></div>
  <div className="rounded-3xl border border-border bg-surface shadow-sm">{loading?<div className="p-12 text-center text-muted-foreground">{tr("جاري التحميل...","Loading...")}</div>:rows.length===0?<div className="p-12 text-center text-muted-foreground"><DatabaseBackup className="mx-auto mb-3" size={34}/><p className="font-bold">{tr("أول نسخة تلقائية راح تنحفظ بموعد النسخ اليومي.","The first automatic snapshot will appear at the next daily backup.")}</p></div>:<div className="divide-y divide-border">{rows.map(r=><div key={r.id} className="flex items-center justify-between gap-4 p-5"><div><p className="font-black" dir="ltr">{r.backup_date}</p><p className="text-xs text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleString("en-GB")}</p></div><button onClick={()=>download(r)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white"><Download size={16}/>{tr("تحميل","Download")}</button></div>)}</div>}</div>
 </div>;
}
