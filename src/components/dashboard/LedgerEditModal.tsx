"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";

export default function LedgerEditModal({id,type,currency,onClose,onSaved}:{id:string;type:"receivable"|"payment";currency:string;onClose:()=>void;onSaved:()=>void|Promise<void>}) {
  const { tr } = useLanguage();
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [service,setService]=useState("");
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState("");
  const [dueDate,setDueDate]=useState("");
  const [method,setMethod]=useState("");
  const [notes,setNotes]=useState("");

  useEffect(()=>{void (async()=>{
    const table=type==="receivable"?"spc_receivables":"spc_payments";
    const columns=type==="receivable"?"service_name,amount,issue_date,due_date,notes":"amount,payment_date,payment_method,notes";
    const {data,error:e}=await supabasePersistent.from(table).select(columns).eq("id",id).single();
    if(e){setError(e.message);setLoading(false);return;}
    const d=data as any;
    setAmount(String(d.amount??""));
    setNotes(d.notes??"");
    if(type==="receivable"){setService(d.service_name??"");setDate(d.issue_date??"");setDueDate(d.due_date??"");}
    else {setDate(d.payment_date??"");setMethod(d.payment_method??"");}
    setLoading(false);
  })();},[id,type]);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();setSaving(true);setError("");
    const value=Number(amount);
    if(!value||value<=0){setError(tr("اكتب المبلغ بشكل صحيح.","Enter a valid amount."));setSaving(false);return;}
    const result=type==="receivable"
      ? await supabasePersistent.rpc("spc_update_receivable_safe",{p_receivable_id:id,p_service_name:service,p_amount:value,p_issue_date:date,p_due_date:dueDate||null,p_notes:notes||null})
      : await supabasePersistent.rpc("spc_update_payment_safe",{p_payment_id:id,p_amount:value,p_payment_date:date,p_payment_method:method||null,p_notes:notes||null});
    if(result.error){
      const msg=result.error.message.includes("AMOUNT_BELOW_PAID")?tr("المبلغ الجديد أقل من المقبوض.","New amount is below received payments."):result.error.message.includes("PAYMENT_EXCEEDS_RECEIVABLE")?tr("القبض الجديد يجعل مجموع المقبوض أكبر من الاستحقاق.","Updated payment would exceed the receivable total."):result.error.message;
      setError(msg);setSaving(false);return;
    }
    await onSaved();setSaving(false);
  };

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{type==="receivable"?tr("تعديل الاستحقاق","Edit Receivable"):tr("تعديل القبض","Edit Payment")}</h2><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-surface-2"><X size={20}/></button></div>
      {loading?<div className="py-10 text-center text-muted-foreground">{tr("جاري التحميل...","Loading...")}</div>:<div className="space-y-4">
        {type==="receivable"&&<Input label={tr("الخدمة / البيان","Service / Description")} value={service} onChange={setService}/>}
        <Input label={tr("المبلغ","Amount")+" ("+currency+")"} value={amount} onChange={setAmount} type="number"/>
        <Input label={tr("التاريخ","Date")} value={date} onChange={setDate} type="date"/>
        {type==="receivable"&&<Input label={tr("تاريخ الاستحقاق","Due Date")} value={dueDate} onChange={setDueDate} type="date"/>}
        {type==="payment"&&<Input label={tr("طريقة القبض","Payment Method")} value={method} onChange={setMethod}/>}
        <Input label={tr("ملاحظات","Notes")} value={notes} onChange={setNotes}/>
      </div>}
      {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <button disabled={saving||loading} className="mt-6 w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-60">{saving?tr("جاري الحفظ...","Saving..."):tr("حفظ التعديل","Save Changes")}</button>
    </form>
  </div>;
}
function Input({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string}) {return <div><label className="mb-2 block text-sm font-medium">{label}</label><input type={type} min={type==="number"?"0.01":undefined} step={type==="number"?"0.01":undefined} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-brand"/></div>}
