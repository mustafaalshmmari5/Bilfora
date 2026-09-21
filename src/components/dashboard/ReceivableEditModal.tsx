"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";

type Row = {
  id:string;
  service_name:string;
  due_amount:number|string;
  issue_date:string;
  due_date:string|null;
  notes:string|null;
  currency:"IQD"|"USD";
};

export default function ReceivableEditModal({row,onClose,onSaved}:{row:Row;onClose:()=>void;onSaved:()=>void|Promise<void>}) {
  const { tr } = useLanguage();
  const [service,setService]=useState(row.service_name);
  const [amount,setAmount]=useState(String(row.due_amount));
  const [date,setDate]=useState(row.issue_date);
  const [dueDate,setDueDate]=useState(row.due_date||"");
  const [notes,setNotes]=useState(row.notes||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    setSaving(true);setError("");
    const value=Number(amount);
    if(!value||value<=0){setError(tr("اكتب المبلغ بشكل صحيح.","Enter a valid amount."));setSaving(false);return;}
    const {error:rpcError}=await supabasePersistent.rpc("spc_update_receivable_safe",{
      p_receivable_id:row.id,
      p_service_name:service,
      p_amount:value,
      p_issue_date:date,
      p_due_date:dueDate||null,
      p_notes:notes||null,
    });
    if(rpcError){
      setError(rpcError.message.includes("AMOUNT_BELOW_PAID")?tr("المبلغ الجديد أقل من المقبوض على هذه الحركة.","New amount is below the amount already received."):rpcError.message);
      setSaving(false);return;
    }
    await onSaved();
    setSaving(false);
  };

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div><h2 className="text-xl font-black">{tr("تعديل الحركة","Edit Movement")}</h2><p className="text-sm text-muted-foreground">{tr("عدّل البيانات بدون التأثير على باقي الحركات.","Update this movement without changing other entries.")}</p></div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-surface-2"><X size={20}/></button>
      </div>
      <div className="space-y-4">
        <Input label={tr("الخدمة / البيان","Service / Description")} value={service} onChange={setService} required/>
        <Input label={tr("المبلغ","Amount")+" ("+row.currency+")"} value={amount} onChange={setAmount} type="number" required/>
        <Input label={tr("التاريخ","Date")} value={date} onChange={setDate} type="date" required/>
        <Input label={tr("تاريخ الاستحقاق","Due Date")} value={dueDate} onChange={setDueDate} type="date"/>
        <Input label={tr("ملاحظات","Notes")} value={notes} onChange={setNotes}/>
      </div>
      {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="mt-6 w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-60">{saving?tr("جاري الحفظ...","Saving..."):tr("حفظ التعديل","Save Changes")}</button>
    </form>
  </div>;
}
function Input({label,value,onChange,type="text",required}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}) {
  return <div><label className="mb-2 block text-sm font-medium">{label}</label><input required={required} min={type==="number"?"0.01":undefined} step={type==="number"?"0.01":undefined} type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand"/></div>;
}
