"use client";

import { ChangeEvent, useRef, useState } from "react";
import { FileText, Paperclip, RefreshCw, Trash2 } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";
import { toast } from "sonner";

export default function InvoiceActions({
  receivableId,
  filePath,
  fileName,
  onChanged,
}: {
  receivableId: string;
  filePath: string | null;
  fileName: string | null;
  onChanged: () => void | Promise<void>;
}) {
  const { tr } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const open = async () => {
    if (!filePath) return;
    const { data, error } = await supabasePersistent.storage
      .from("spc-invoices")
      .createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) {
      toast.error(tr("تعذر فتح الفاتورة.","Unable to open invoice."));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const pick = () => inputRef.current?.click();

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowed = ["application/pdf","image/jpeg","image/png","image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(tr("الفاتورة لازم تكون PDF أو صورة.","Invoice must be a PDF or image."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(tr("حجم الفاتورة يجب ألا يتجاوز 10MB.","Invoice file must not exceed 10MB."));
      return;
    }

    setBusy(true);
    const { data: auth } = await supabasePersistent.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      toast.error(tr("انتهت الجلسة.","Session expired."));
      setBusy(false);
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const newPath = userId + "/" + receivableId + "/" + Date.now() + "-" + safeName;
    const { error: uploadError } = await supabasePersistent.storage
      .from("spc-invoices")
      .upload(newPath, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (uploadError) {
      toast.error(tr("فشل رفع الفاتورة.","Invoice upload failed."));
      setBusy(false);
      return;
    }

    const { error: updateError } = await supabasePersistent
      .from("spc_receivables")
      .update({ invoice_file_path: newPath, invoice_file_name: file.name })
      .eq("id", receivableId);

    if (updateError) {
      await supabasePersistent.storage.from("spc-invoices").remove([newPath]);
      toast.error(updateError.message);
      setBusy(false);
      return;
    }

    if (filePath) await supabasePersistent.storage.from("spc-invoices").remove([filePath]);
    toast.success(tr("تم تحديث الفاتورة ✓","Invoice updated ✓"));
    await onChanged();
    setBusy(false);
  };

  const remove = async () => {
    if (!filePath) return;
    if (!window.confirm(tr("حذف مرفق الفاتورة؟","Delete invoice attachment?"))) return;
    setBusy(true);

    const { error } = await supabasePersistent
      .from("spc_receivables")
      .update({ invoice_file_path: null, invoice_file_name: null })
      .eq("id", receivableId);

    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }

    await supabasePersistent.storage.from("spc-invoices").remove([filePath]);
    toast.success(tr("تم حذف مرفق الفاتورة.","Invoice attachment deleted."));
    await onChanged();
    setBusy(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input ref={inputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
      {filePath && (
        <button type="button" onClick={()=>void open()} disabled={busy} className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 px-2.5 py-2 text-xs font-bold text-brand hover:bg-brand-soft disabled:opacity-50" title={fileName||undefined}>
          <FileText size={14}/>{tr("عرض","View")}
        </button>
      )}
      <button type="button" onClick={pick} disabled={busy} className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 px-2.5 py-2 text-xs font-bold hover:bg-surface-inset disabled:opacity-50">
        {filePath?<RefreshCw size={14}/>:<Paperclip size={14}/>}
        {filePath?tr("تبديل","Replace"):tr("إرفاق","Attach")}
      </button>
      {filePath && (
        <button type="button" onClick={()=>void remove()} disabled={busy} className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50" title={tr("حذف الفاتورة","Delete invoice")}>
          <Trash2 size={14}/>
        </button>
      )}
    </div>
  );
}
