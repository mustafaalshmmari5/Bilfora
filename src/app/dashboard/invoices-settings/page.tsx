"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, ExternalLink, FileText, Search } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { useLanguage } from "@/lib/language";
import { toast } from "sonner";

type InvoiceRow = {
  id: string;
  company_id: string;
  company_name: string;
  sap_code: string;
  service_name: string;
  issue_date: string;
  due_amount: number | string;
  currency: "IQD" | "USD";
  invoice_file_path: string;
  invoice_file_name: string | null;
};

const money = (value: number | string, currency: string) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: currency === "IQD" ? 0 : 2,
  }).format(Number(value || 0)) + " " + currency;

export default function InvoiceListPage() {
  const { tr } = useLanguage();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabasePersistent
        .from("spc_account_rows")
        .select("id,company_id,company_name,sap_code,service_name,issue_date,due_amount,currency,invoice_file_path,invoice_file_name")
        .not("invoice_file_path", "is", null)
        .order("issue_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(loadError.message);
      } else {
        setRows((data ?? []) as InvoiceRow[]);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return rows;

    return rows.filter((row) =>
      [
        row.invoice_file_name ?? "",
        row.company_name,
        row.sap_code,
        row.service_name,
        row.issue_date,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [rows, query]);

  const openInvoice = async (row: InvoiceRow) => {
    const { data, error: signedError } = await supabasePersistent.storage
      .from("spc-invoices")
      .createSignedUrl(row.invoice_file_path, 300);

    if (signedError || !data?.signedUrl) {
      toast.error(tr("تعذر فتح الفاتورة.","Unable to open invoice."));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">{tr("قائمة الفواتير","Invoice List")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("كل فاتورة مرفقة ويا حركة تظهر هنا وتكدر تبحث عنها وتفتحها.","Every invoice attached to a movement appears here for quick search and access.")}
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2"
        >
          <ArrowRight size={17} />
          {tr("رجوع للإعدادات","Back to Settings")}
        </Link>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("ابحث باسم الفاتورة، الشركة، الخدمة أو SAP...","Search invoice name, company, service or SAP...")}
            className="input pr-11"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-border bg-surface p-12 text-center text-muted-foreground shadow-sm">
          {tr("جاري تحميل الفواتير...","Loading invoices...")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-12 text-center shadow-sm">
          <FileText className="mx-auto mb-3 text-muted-foreground" size={34} />
          <p className="font-black">
            {query ? tr("ماكو فاتورة مطابقة للبحث.","No invoice matches your search.") : tr("ماكو فواتير مرفقة حالياً.","No attached invoices yet.")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("أي فاتورة تضيفها ويا الحركة راح تظهر هنا تلقائياً.","Any invoice attached to a movement will appear here automatically.")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr>
                  <th className="p-4 text-right">{tr("اسم الفاتورة","Invoice Name")}</th>
                  <th className="p-4 text-right">{tr("الشركة","Company")}</th>
                  <th className="p-4 text-right">SAP</th>
                  <th className="p-4 text-right">{tr("الخدمة / البيان","Service / Description")}</th>
                  <th className="p-4 text-right">{tr("التاريخ","Date")}</th>
                  <th className="p-4 text-right">{tr("المبلغ","Amount")}</th>
                  <th className="p-4 text-right">{tr("فتح","Open")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row) => (
                  <tr key={row.id} className="transition hover:bg-surface-2">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-brand-soft p-2 text-brand">
                          <FileText size={17} />
                        </div>
                        <span className="max-w-[280px] truncate font-bold" title={row.invoice_file_name ?? undefined}>
                          {row.invoice_file_name || tr("فاتورة","Invoice")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-muted-foreground" />
                        <span className="font-medium">{row.company_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono" dir="ltr">{row.sap_code}</td>
                    <td className="p-4">{row.service_name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} className="text-muted-foreground" />
                        <span dir="ltr">{row.issue_date}</span>
                      </span>
                    </td>
                    <td className="p-4 font-black" dir="ltr">{money(row.due_amount, row.currency)}</td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => void openInvoice(row)}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-hover"
                      >
                        <ExternalLink size={15} />
                        {tr("عرض","View")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
