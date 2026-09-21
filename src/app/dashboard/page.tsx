"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BanknoteArrowDown,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  Plus,
  ReceiptText,
  FileText,
  Paperclip,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import CompanySwitcher from "@/components/dashboard/CompanySwitcher";
import { toast } from "sonner";
import { useLanguage } from "@/lib/language";

type Company = {
  id: string;
  name: string;
  sap_code: string;
  currency: "IQD" | "USD";
  balance: number | string;
  total_due: number | string;
  total_paid: number | string;
  party_type: "company" | "person";
};

type AccountRow = {
  id: string;
  company_id: string;
  entry_type: "order" | "invoice" | "outgoing" | "other";
  service_name: string;
  reference_number: string | null;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  due_amount: number | string;
  company_name: string;
  sap_code: string;
  currency: "IQD" | "USD";
  received_amount: number | string;
  remaining_amount: number | string;
  payment_status: "paid" | "partial" | "unpaid" | "overdue";
  last_payment_date: string | null;
  invoice_file_path: string | null;
  invoice_file_name: string | null;
};

const ENTRY_LABELS: Record<AccountRow["entry_type"], string> = {
  order: "طلب",
  invoice: "استحقاق",
  outgoing: "مصروف / خدمة",
  other: "أخرى",
};

const STATUS_LABELS: Record<AccountRow["payment_status"], string> = {
  paid: "مسدد",
  partial: "جزئي",
  unpaid: "غير مسدد",
  overdue: "متأخر",
};
const ENTRY_LABELS_EN: Record<AccountRow["entry_type"], string> = {
  order: "Order",
  invoice: "Receivable",
  outgoing: "Expense / Service",
  other: "Other",
};
const STATUS_LABELS_EN: Record<AccountRow["payment_status"], string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
  overdue: "Overdue",
};

const today = () => new Date().toISOString().slice(0, 10);

const money = (value: number | string, currency: string) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: currency === "IQD" ? 0 : 2,
  }).format(Number(value || 0)) + " " + currency;

export default function DashboardPage() {
  const { tr } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [error, setError] = useState("");
  const [paymentRow, setPaymentRow] = useState<AccountRow | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    company_id: "",
    entry_type: "outgoing",
    posting_date: today(),
    due_date: "",
    service_name: "",
    due_amount: "",
    received_amount: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [companiesResult, rowsResult] = await Promise.all([
      supabasePersistent
        .from("spc_company_balances")
        .select("id,name,sap_code,currency,balance,total_due,total_paid,party_type")
        .order("name"),
      supabasePersistent
        .from("spc_account_rows")
        .select("*")
        .order("issue_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (companiesResult.error) setError(companiesResult.error.message);
    else setCompanies((companiesResult.data ?? []) as Company[]);

    if (rowsResult.error) setError(rowsResult.error.message);
    else setRows((rowsResult.data ?? []) as AccountRow[]);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const selectedCompany = companies.find((company) => company.id === form.company_id);

  const totals = useMemo(() => {
    const initial = {
      IQD: { due: 0, received: 0, remaining: 0, overdue: 0 },
      USD: { due: 0, received: 0, remaining: 0, overdue: 0 },
    };

    const companyIds = new Set(
      companies
        .filter((company) => company.party_type === "company")
        .map((company) => company.id)
    );

    companies
      .filter((company) => company.party_type === "company")
      .forEach((company) => {
        const bucket = initial[company.currency];
        bucket.due += Number(company.total_due || 0);
        bucket.received += Number(company.total_paid || 0);
        bucket.remaining += Number(company.balance || 0);
      });

    rows.forEach((row) => {
      if (!companyIds.has(row.company_id)) return;
      if (row.payment_status === "overdue") {
        initial[row.currency].overdue += Number(row.remaining_amount || 0);
      }
    });

    return initial;
  }, [companies, rows]);

  const filteredRows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesText =
        !text ||
        [
          row.company_name,
          row.sap_code,
          row.service_name,
          row.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(text);

      const matchesType = typeFilter === "all" || row.entry_type === typeFilter;
      const matchesStatus = statusFilter === "all" || row.payment_status === statusFilter;
      const entityFilter = companyFilter !== "all" ? companyFilter : personFilter;
      const matchesEntity = entityFilter === "all" || row.company_id === entityFilter;

      return matchesText && matchesType && matchesStatus && matchesEntity;
    });
  }, [rows, query, typeFilter, statusFilter, companyFilter, personFilter]);

  const openInvoice = async (row: AccountRow) => {
    if (!row.invoice_file_path) return;
    const { data, error } = await supabasePersistent.storage
      .from("spc-invoices")
      .createSignedUrl(row.invoice_file_path, 300);

    if (error || !data?.signedUrl) {
      toast.error(tr("تعذر فتح الفاتورة.","Unable to open invoice."));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const submitEntry = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.company_id) {
      setError(tr("اختار الشركة أولاً.","Select a company first."));
      return;
    }

    const due = Number(form.due_amount);
    const received = Number(form.received_amount || 0);

    if (!due || due <= 0) {
      setError(tr("اكتب المبلغ المطلوب بشكل صحيح.","Enter the due amount correctly."));
      return;
    }

    if (received < 0 || received > due) {
      setError(tr("المبلغ المستلم لازم يكون بين صفر والمبلغ المطلوب.","Received amount must be between zero and the due amount."));
      return;
    }

    if (invoiceFile) {
      const allowed = ["application/pdf","image/jpeg","image/png","image/webp"];
      if (!allowed.includes(invoiceFile.type)) {
        setError(tr("الفاتورة لازم تكون PDF أو صورة.","Invoice must be a PDF or image."));
        return;
      }
      if (invoiceFile.size > 10 * 1024 * 1024) {
        setError(tr("حجم الفاتورة يجب ألا يتجاوز 10MB.","Invoice file must not exceed 10MB."));
        return;
      }
    }

    setSaving(true);

    const { data: rpcData, error: rpcError } = await supabasePersistent.rpc("spc_add_account_entry", {
      p_company_id: form.company_id,
      p_entry_type: form.entry_type,
      p_service_name: form.service_name.trim(),
      p_due_amount: due,
      p_received_amount: received,
      p_posting_date: form.posting_date,
      p_due_date: form.due_date || null,
      p_reference_number: null,
      p_notes: form.notes.trim() || null,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      if (invoiceFile) {
        const receivableId = rpcData?.[0]?.receivable_id as string | undefined;
        const { data: authData } = await supabasePersistent.auth.getUser();
        const userId = authData.user?.id;

        if (!receivableId || !userId) {
          toast.error(tr("تم حفظ الحركة لكن تعذر ربط الفاتورة.","Movement saved, but the invoice could not be linked."));
        } else {
          const safeName = invoiceFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
          const filePath = userId + "/" + receivableId + "/" + Date.now() + "-" + safeName;

          const { error: uploadError } = await supabasePersistent.storage
            .from("spc-invoices")
            .upload(filePath, invoiceFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: invoiceFile.type,
            });

          if (uploadError) {
            toast.error(tr("تم حفظ الحركة لكن فشل رفع الفاتورة.","Movement saved, but invoice upload failed."));
          } else {
            const { error: attachError } = await supabasePersistent
              .from("spc_receivables")
              .update({
                invoice_file_path: filePath,
                invoice_file_name: invoiceFile.name,
              })
              .eq("id", receivableId);

            if (attachError) {
              await supabasePersistent.storage.from("spc-invoices").remove([filePath]);
              toast.error(tr("تم حفظ الحركة لكن تعذر ربط الفاتورة.","Movement saved, but the invoice could not be linked."));
            }
          }
        }
      }

      const companyName = selectedCompany?.name || tr("الشركة","Company");
      const currency = selectedCompany?.currency || "IQD";
      const remaining = Math.max(due - received, 0);

      toast.success(tr("تمت إضافة الحركة بنجاح ✓","Movement added successfully ✓"), {
        description: companyName + " • " + tr("المطلوب","Due") + " " + money(due, currency) + " • " + tr("الباقي","Remaining") + " " + money(remaining, currency),
        duration: 4500,
      });
      window.dispatchEvent(new Event("spc-movement-created"));

      setForm((prev) => ({
        ...prev,
        posting_date: today(),
        due_date: "",
        service_name: "",
        due_amount: "",
        received_amount: "",
        notes: "",
      }));
      setInvoiceFile(null);
      await load();
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black">{tr("مستحقات الشركات التابعة إلى SPC","SPC Company Receivables")}</h1>
        </div>
        <div className="mt-14 flex flex-wrap items-center gap-2 lg:mt-14">
          <CompanySwitcher />
          <Link
            href="/dashboard/companies?new=1"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2"
          >
            <Building2 size={17} />
            {tr("شركة جديدة","New Company")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(["IQD", "USD"] as const).map((currency) => (
          <div key={currency} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">{currency === "IQD" ? tr("الدينار العراقي","Iraqi Dinar") : tr("الدولار","US Dollar")}</h2>
              </div>
              <CircleDollarSign className="text-brand" size={22} />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Summary label={tr("المطلوب","Due")} value={money(totals[currency].due, currency)} icon={WalletCards} />
              <Summary label={tr("المستلم","Received")} value={money(totals[currency].received, currency)} icon={BanknoteArrowDown} success />
              <Summary label={tr("الباقي","Remaining")} value={money(totals[currency].remaining, currency)} icon={CircleDollarSign} />
              <Summary label={tr("المتأخر","Overdue")} value={money(totals[currency].overdue, currency)} icon={AlertTriangle} danger />
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submitEntry} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-brand-soft p-3 text-brand">
            <Plus size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black">{tr("إضافة حركة سريعة","Quick Entry")}</h2>
          </div>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-danger-border bg-danger-soft p-3 text-sm text-danger">{error}</div>}

        <div className="grid gap-3 lg:grid-cols-12">
          <FieldWrap label={tr("نوع الحركة","Movement Type")} className="lg:col-span-2">
            <select
              value={form.entry_type}
              onChange={(e) => setForm({ ...form, entry_type: e.target.value })}
              className="input"
            >
              <option value="order">{tr("طلب","Order")}</option>
              <option value="invoice">{tr("استحقاق","Receivable")}</option>
              <option value="outgoing">{tr("مصروف / خدمة","Expense / Service")}</option>
              <option value="other">{tr("أخرى","Other")}</option>
            </select>
          </FieldWrap>

          <FieldWrap label={tr("الشركة / SAP","Company / SAP")} className="lg:col-span-3">
            <select
              required
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
              className="input"
            >
              <option value="">{tr("اختار الشركة","Select Company")}</option>
              {companies
                .filter((company) => company.party_type === "company")
                .map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} — {company.sap_code}
                  </option>
                ))}
            </select>
          </FieldWrap>

          <FieldWrap label={tr("التاريخ","Date")} className="lg:col-span-2">
            <input
              required
              type="date"
              value={form.posting_date}
              onChange={(e) => setForm({ ...form, posting_date: e.target.value })}
              className="input"
            />
          </FieldWrap>

          <FieldWrap label={tr("تاريخ الاستحقاق","Due Date")} className="lg:col-span-2">
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input"
            />
          </FieldWrap>

          <FieldWrap label={tr("الخدمة / البيان","Service / Description")} className="lg:col-span-9">
            <input
              required
              value={form.service_name}
              onChange={(e) => setForm({ ...form, service_name: e.target.value })}
              className="input"
            />
          </FieldWrap>

          <FieldWrap label={tr("المطلوب","Due") + (selectedCompany ? " (" + selectedCompany.currency + ")" : "")} className="lg:col-span-2">
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.due_amount}
              onChange={(e) => setForm({ ...form, due_amount: e.target.value })}
              placeholder="0"
              className="input"
            />
          </FieldWrap>

          <FieldWrap label={tr("المستلم الآن","Received Now")} className="lg:col-span-2">
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.received_amount}
              onChange={(e) => setForm({ ...form, received_amount: e.target.value })}
              placeholder="0"
              className="input"
            />
          </FieldWrap>

          <FieldWrap label={tr("الباقي تلقائياً","Remaining Automatically")} className="lg:col-span-2">
            <div className="input flex items-center font-black text-brand">
              {selectedCompany
                ? money(
                    Math.max(Number(form.due_amount || 0) - Number(form.received_amount || 0), 0),
                    selectedCompany.currency
                  )
                : "—"}
            </div>
          </FieldWrap>

          <FieldWrap label={tr("ملاحظات","Notes")} className="lg:col-span-6">
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
            />
          </FieldWrap>

          <FieldWrap label={tr("فاتورة الحركة (اختياري)","Invoice Attachment (Optional)")} className="lg:col-span-3">
            <label className="input flex cursor-pointer items-center gap-2 overflow-hidden">
              <Paperclip size={16} className="shrink-0 text-brand" />
              <span className="truncate text-sm">
                {invoiceFile ? invoiceFile.name : tr("اختيار PDF أو صورة","Choose PDF or image")}
              </span>
              <input
                key={invoiceFile ? invoiceFile.name : "empty-invoice"}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </FieldWrap>

          <div className="flex items-end lg:col-span-3">
            <button
              disabled={saving || loading}
              className="w-full rounded-2xl bg-brand px-5 py-3 font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {saving ? tr("جاري الحفظ...","Saving...") : tr("إضافة الحركة","Add Movement")}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-black">{tr("سجل الحركات","Movement History")}</h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tr("بحث...","Search...")}
                  className="input pr-9"
                />
              </div>

              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input">
                <option value="all">{tr("كل الأنواع","All Types")}</option>
                <option value="order">{tr("طلب","Order")}</option>
                <option value="invoice">{tr("استحقاق","Receivable")}</option>
                <option value="outgoing">{tr("مصروف / خدمة","Expense / Service")}</option>
                <option value="other">{tr("أخرى","Other")}</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
                <option value="all">{tr("كل الحالات","All Statuses")}</option>
                <option value="paid">{tr("مسدد","Paid")}</option>
                <option value="partial">{tr("جزئي","Partial")}</option>
                <option value="unpaid">{tr("غير مسدد","Unpaid")}</option>
                <option value="overdue">{tr("متأخر","Overdue")}</option>
              </select>

              <select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  if (e.target.value !== "all") setPersonFilter("all");
                }}
                className="input"
              >
                <option value="all">{tr("كل الشركات","All Companies")}</option>
                {companies
                  .filter((company) => company.party_type === "company")
                  .map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} — {company.sap_code}
                    </option>
                  ))}
              </select>

              <select
                value={personFilter}
                onChange={(e) => {
                  setPersonFilter(e.target.value);
                  if (e.target.value !== "all") setCompanyFilter("all");
                }}
                className="input"
              >
                <option value="all">{tr("كل الأشخاص","All People")}</option>
                {companies
                  .filter((company) => company.party_type === "person")
                  .map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} — {company.sap_code}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">{tr("جاري تحميل الحركات...","Loading movements...")}</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="mx-auto mb-3 text-muted-foreground" size={40} />
            <p className="font-bold">{tr("ماكو حركات حالياً","No movements yet")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr>
                  <th className="p-4 text-right">{tr("النوع","Type")}</th>
                  <th className="p-4 text-right">{tr("الشركة","Company")}</th>
                  <th className="p-4 text-right">SAP</th>
                  <th className="p-4 text-right">{tr("التاريخ","Date")}</th>
                  <th className="p-4 text-right">{tr("الخدمة / البيان","Service / Description")}</th>
                  <th className="p-4 text-right">{tr("المطلوب","Due")}</th>
                  <th className="p-4 text-right">{tr("المستلم","Received")}</th>
                  <th className="p-4 text-right">{tr("الباقي","Remaining")}</th>
                  <th className="p-4 text-right">{tr("الحالة","Status")}</th>
                  <th className="p-4 text-right">{tr("الفاتورة","Invoice")}</th>
                  <th className="p-4 text-right">{tr("إجراء","Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-surface-2">
                    <td className="p-4">
                      <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                        {tr(ENTRY_LABELS[row.entry_type], ENTRY_LABELS_EN[row.entry_type])}
                      </span>
                    </td>
                    <td className="p-4 font-bold">{row.company_name}</td>
                    <td className="p-4 text-muted-foreground">{row.sap_code}</td>
                    <td className="p-4">{row.issue_date}</td>
                    <td className="max-w-[360px] p-4">
                      <p className="font-medium">{row.service_name}</p>
                      {(row.reference_number || row.notes) && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {[row.reference_number, row.notes].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </td>
                    <td className="p-4 font-bold">{money(row.due_amount, row.currency)}</td>
                    <td className="p-4 font-bold text-brand">{money(row.received_amount, row.currency)}</td>
                    <td className="p-4 font-black">{money(row.remaining_amount, row.currency)}</td>
                    <td className="p-4"><StatusBadge status={row.payment_status} /></td>
                    <td className="p-4">
                      {row.invoice_file_path ? (
                        <button
                          type="button"
                          onClick={() => void openInvoice(row)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-brand hover:bg-brand-soft"
                          title={row.invoice_file_name || undefined}
                        >
                          <FileText size={15} />
                          {tr("عرض","View")}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {Number(row.remaining_amount) > 0 ? (
                        <button
                          onClick={() => setPaymentRow(row)}
                          className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-hover"
                        >
                          تسجيل قبض
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
                          <CheckCircle2 size={15} /> {tr("مكتمل","Completed")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paymentRow && (
        <PaymentModal
          row={paymentRow}
          onClose={() => setPaymentRow(null)}
          onSaved={async () => {
            setPaymentRow(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function PaymentModal({
  row,
  onClose,
  onSaved,
}: {
  row: AccountRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { tr } = useLanguage();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);

    if (!value || value <= 0) {
      setError(tr("اكتب مبلغ القبض.","Enter the payment amount."));
      return;
    }

    if (value > Number(row.remaining_amount)) {
      setError(tr("مبلغ القبض أكبر من الباقي على هذا السطر.","Payment amount exceeds the remaining balance."));
      return;
    }

    setSaving(true);
    setError("");

    const { data } = await supabasePersistent.auth.getUser();
    if (!data.user) {
      setError(tr("انتهت الجلسة.","Session expired."));
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabasePersistent.from("spc_payments").insert({
      company_id: row.company_id,
      receivable_id: row.id,
      created_by: data.user.id,
      amount: value,
      payment_date: date,
      payment_method: "استلام",
      reference_number: null,
      notes: notes.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      const newRemaining = Math.max(Number(row.remaining_amount) - value, 0);
      toast.success(tr("تم تسجيل القبض وتحديث الرصيد ✓","Payment recorded and balance updated ✓"), {
        description: row.company_name + " • " + tr("استلام","Receipt") + " " + money(value, row.currency) + " • " + tr("الباقي","Remaining") + " " + money(newRemaining, row.currency),
        duration: 4500,
      });
      window.dispatchEvent(new Event("spc-movement-created"));
      onSaved();
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">{tr("تسجيل قبض","Record Payment")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{row.company_name} — {row.service_name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-surface-2">
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl bg-surface-2 p-4">
          <div>
            <p className="text-xs text-muted-foreground">{tr("الباقي حالياً","Current Balance")}</p>
            <p className="mt-1 font-black">{money(row.remaining_amount, row.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{tr("المستلم سابقاً","Previously Received")}</p>
            <p className="mt-1 font-bold text-brand">{money(row.received_amount, row.currency)}</p>
          </div>
        </div>

        <div className="grid gap-4">
          <FieldWrap label={tr("مبلغ القبض","Payment Amount")}>
            <input
              autoFocus
              required
              min="0"
              max={Number(row.remaining_amount)}
              step="0.01"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
            />
          </FieldWrap>
          <FieldWrap label={tr("التاريخ","Date")}>
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </FieldWrap>
          <FieldWrap label={tr("ملاحظات","Notes")}>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder={tr("اختياري","Optional")} />
          </FieldWrap>
        </div>

        {amount && (
          <div className="mt-4 rounded-2xl bg-brand-soft p-4">
            <p className="text-xs text-muted-foreground">{tr("الباقي بعد القبض","Balance After Payment")}</p>
            <p className="mt-1 text-lg font-black text-brand">
              {money(Math.max(Number(row.remaining_amount) - Number(amount || 0), 0), row.currency)}
            </p>
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}

        <button
          disabled={saving}
          className="mt-5 w-full rounded-2xl bg-brand py-3.5 font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {saving ? tr("جاري الحفظ...","Saving...") : tr("تأكيد القبض","Confirm Payment")}
        </button>
      </form>
    </div>
  );
}

function FieldWrap({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  success,
  danger,
}: {
  label: string;
  value: string;
  icon: any;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className={"mb-3 inline-flex rounded-xl p-2 " + (danger ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand")}>
        <Icon size={16} />
      </div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AccountRow["payment_status"] }) {
  const { tr } = useLanguage();
  const styles =
    status === "overdue"
      ? "bg-danger-soft text-danger"
      : status === "unpaid"
        ? "bg-surface-inset text-muted-foreground"
        : "bg-brand-soft text-brand";

  return <span className={"rounded-full px-3 py-1 text-xs font-bold " + styles}>{tr(STATUS_LABELS[status], STATUS_LABELS_EN[status])}</span>;
}
