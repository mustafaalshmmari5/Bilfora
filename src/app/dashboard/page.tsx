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
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import CompanySwitcher from "@/components/dashboard/CompanySwitcher";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
  sap_code: string;
  currency: "IQD" | "USD";
  balance: number | string;
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

const today = () => new Date().toISOString().slice(0, 10);

const money = (value: number | string, currency: string) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: currency === "IQD" ? 0 : 2,
  }).format(Number(value || 0)) + " " + currency;

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [error, setError] = useState("");
  const [paymentRow, setPaymentRow] = useState<AccountRow | null>(null);

  const [form, setForm] = useState({
    company_id: "",
    entry_type: "outgoing",
    posting_date: today(),
    due_date: "",
    service_name: "",
    reference_number: "",
    due_amount: "",
    received_amount: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [companiesResult, rowsResult] = await Promise.all([
      supabasePersistent
        .from("spc_company_balances")
        .select("id,name,sap_code,currency,balance")
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

    rows.forEach((row) => {
      const bucket = initial[row.currency];
      bucket.due += Number(row.due_amount || 0);
      bucket.received += Number(row.received_amount || 0);
      bucket.remaining += Number(row.remaining_amount || 0);
      if (row.payment_status === "overdue") {
        bucket.overdue += Number(row.remaining_amount || 0);
      }
    });

    return initial;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesText =
        !text ||
        [
          row.company_name,
          row.sap_code,
          row.service_name,
          row.reference_number ?? "",
          row.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(text);

      const matchesType = typeFilter === "all" || row.entry_type === typeFilter;
      const matchesStatus = statusFilter === "all" || row.payment_status === statusFilter;
      const matchesCompany = companyFilter === "all" || row.company_id === companyFilter;

      return matchesText && matchesType && matchesStatus && matchesCompany;
    });
  }, [rows, query, typeFilter, statusFilter, companyFilter]);

  const submitEntry = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.company_id) {
      setError("اختار الشركة أولاً.");
      return;
    }

    const due = Number(form.due_amount);
    const received = Number(form.received_amount || 0);

    if (!due || due <= 0) {
      setError("اكتب المبلغ المطلوب بشكل صحيح.");
      return;
    }

    if (received < 0 || received > due) {
      setError("المبلغ المستلم لازم يكون بين صفر والمبلغ المطلوب.");
      return;
    }

    setSaving(true);

    const { error: rpcError } = await supabasePersistent.rpc("spc_add_account_entry", {
      p_company_id: form.company_id,
      p_entry_type: form.entry_type,
      p_service_name: form.service_name.trim(),
      p_due_amount: due,
      p_received_amount: received,
      p_posting_date: form.posting_date,
      p_due_date: form.due_date || null,
      p_reference_number: form.reference_number.trim() || null,
      p_notes: form.notes.trim() || null,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      const companyName = selectedCompany?.name || "الشركة";
      const currency = selectedCompany?.currency || "IQD";
      const remaining = Math.max(due - received, 0);

      toast.success("تمت إضافة الحركة بنجاح ✓", {
        description: companyName + " • المطلوب " + money(due, currency) + " • الباقي " + money(remaining, currency),
        duration: 4500,
      });
      window.dispatchEvent(new Event("spc-movement-created"));

      setForm((prev) => ({
        ...prev,
        posting_date: today(),
        due_date: "",
        service_name: "",
        reference_number: "",
        due_amount: "",
        received_amount: "",
        notes: "",
      }));
      await load();
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black">مستحقات الشركات التابعة إلى SPC</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سجّل المطلوب والمستلم بسرعة، والباقي والحالة ينحسبون تلقائياً.
          </p>
        </div>
        <div className="mt-14 flex flex-wrap items-center gap-2 lg:mt-14">
          <CompanySwitcher />
          <Link
            href="/dashboard/companies?new=1"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-surface-2"
          >
            <Building2 size={17} />
            شركة جديدة
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(["IQD", "USD"] as const).map((currency) => (
          <div key={currency} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ملخص العملة</p>
                <h2 className="text-lg font-black">{currency === "IQD" ? "الدينار العراقي" : "الدولار"}</h2>
              </div>
              <CircleDollarSign className="text-brand" size={22} />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Summary label="المطلوب" value={money(totals[currency].due, currency)} icon={WalletCards} />
              <Summary label="المستلم" value={money(totals[currency].received, currency)} icon={BanknoteArrowDown} success />
              <Summary label="الباقي" value={money(totals[currency].remaining, currency)} icon={CircleDollarSign} />
              <Summary label="المتأخر" value={money(totals[currency].overdue, currency)} icon={AlertTriangle} danger />
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
            <h2 className="text-xl font-black">إضافة حركة سريعة</h2>
            <p className="text-sm text-muted-foreground">مثل سطر الإكسل، بس الحسابات تصير تلقائياً.</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-danger-border bg-danger-soft p-3 text-sm text-danger">{error}</div>}

        <div className="grid gap-3 lg:grid-cols-12">
          <FieldWrap label="نوع الحركة" className="lg:col-span-2">
            <select
              value={form.entry_type}
              onChange={(e) => setForm({ ...form, entry_type: e.target.value })}
              className="input"
            >
              <option value="order">طلب</option>
              <option value="invoice">استحقاق</option>
              <option value="outgoing">مصروف / خدمة</option>
              <option value="other">أخرى</option>
            </select>
          </FieldWrap>

          <FieldWrap label="الشركة / SAP" className="lg:col-span-3">
            <select
              required
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
              className="input"
            >
              <option value="">اختار الشركة</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} — {company.sap_code}
                </option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap label="التاريخ" className="lg:col-span-2">
            <input
              required
              type="date"
              value={form.posting_date}
              onChange={(e) => setForm({ ...form, posting_date: e.target.value })}
              className="input"
            />
          </FieldWrap>

          <FieldWrap label="تاريخ الاستحقاق" className="lg:col-span-2">
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input"
            />
          </FieldWrap>

          <FieldWrap label="المرجع" className="lg:col-span-3">
            <input
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              placeholder="اختياري"
              className="input"
            />
          </FieldWrap>

          <FieldWrap label="الخدمة / البيان" className="lg:col-span-6">
            <input
              required
              value={form.service_name}
              onChange={(e) => setForm({ ...form, service_name: e.target.value })}
              placeholder="مثلاً: SAP Support 08-2026"
              className="input"
            />
          </FieldWrap>

          <FieldWrap label={"المطلوب" + (selectedCompany ? " (" + selectedCompany.currency + ")" : "")} className="lg:col-span-2">
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

          <FieldWrap label="المستلم الآن" className="lg:col-span-2">
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

          <FieldWrap label="الباقي تلقائياً" className="lg:col-span-2">
            <div className="input flex items-center font-black text-brand">
              {selectedCompany
                ? money(
                    Math.max(Number(form.due_amount || 0) - Number(form.received_amount || 0), 0),
                    selectedCompany.currency
                  )
                : "—"}
            </div>
          </FieldWrap>

          <FieldWrap label="ملاحظات" className="lg:col-span-9">
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="أي تفاصيل إضافية..."
              className="input"
            />
          </FieldWrap>

          <div className="flex items-end lg:col-span-3">
            <button
              disabled={saving || loading}
              className="w-full rounded-2xl bg-brand px-5 py-3 font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "إضافة الحركة"}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-black">سجل الحركات</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                كل سطر يبين المطلوب، المستلم والباقي لنفس الخدمة.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث..."
                  className="input pr-9"
                />
              </div>

              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input">
                <option value="all">كل الأنواع</option>
                <option value="order">طلب</option>
                <option value="invoice">استحقاق</option>
                <option value="outgoing">مصروف / خدمة</option>
                <option value="other">أخرى</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
                <option value="all">كل الحالات</option>
                <option value="paid">مسدد</option>
                <option value="partial">جزئي</option>
                <option value="unpaid">غير مسدد</option>
                <option value="overdue">متأخر</option>
              </select>

              <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="input">
                <option value="all">كل الشركات</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} — {company.sap_code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">جاري تحميل الحركات...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="mx-auto mb-3 text-muted-foreground" size={40} />
            <p className="font-bold">ماكو حركات حالياً</p>
            <p className="mt-1 text-sm text-muted-foreground">أضف أول حركة من النموذج اللي فوق.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr>
                  <th className="p-4 text-right">النوع</th>
                  <th className="p-4 text-right">الشركة</th>
                  <th className="p-4 text-right">SAP</th>
                  <th className="p-4 text-right">التاريخ</th>
                  <th className="p-4 text-right">الخدمة / البيان</th>
                  <th className="p-4 text-right">المطلوب</th>
                  <th className="p-4 text-right">المستلم</th>
                  <th className="p-4 text-right">الباقي</th>
                  <th className="p-4 text-right">الحالة</th>
                  <th className="p-4 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-surface-2">
                    <td className="p-4">
                      <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                        {ENTRY_LABELS[row.entry_type]}
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
                      {Number(row.remaining_amount) > 0 ? (
                        <button
                          onClick={() => setPaymentRow(row)}
                          className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-hover"
                        >
                          تسجيل قبض
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
                          <CheckCircle2 size={15} /> مكتمل
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
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);

    if (!value || value <= 0) {
      setError("اكتب مبلغ القبض.");
      return;
    }

    if (value > Number(row.remaining_amount)) {
      setError("مبلغ القبض أكبر من الباقي على هذا السطر.");
      return;
    }

    setSaving(true);
    setError("");

    const { data } = await supabasePersistent.auth.getUser();
    if (!data.user) {
      setError("انتهت الجلسة.");
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
      reference_number: reference.trim() || null,
      notes: notes.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      const newRemaining = Math.max(Number(row.remaining_amount) - value, 0);
      toast.success("تم تسجيل القبض وتحديث الرصيد ✓", {
        description: row.company_name + " • استلام " + money(value, row.currency) + " • الباقي " + money(newRemaining, row.currency),
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
            <h2 className="text-xl font-black">تسجيل قبض</h2>
            <p className="mt-1 text-sm text-muted-foreground">{row.company_name} — {row.service_name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-surface-2">
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl bg-surface-2 p-4">
          <div>
            <p className="text-xs text-muted-foreground">الباقي حالياً</p>
            <p className="mt-1 font-black">{money(row.remaining_amount, row.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">المستلم سابقاً</p>
            <p className="mt-1 font-bold text-brand">{money(row.received_amount, row.currency)}</p>
          </div>
        </div>

        <div className="grid gap-4">
          <FieldWrap label="مبلغ القبض">
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
          <FieldWrap label="التاريخ">
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </FieldWrap>
          <FieldWrap label="رقم المرجع">
            <input value={reference} onChange={(e) => setReference(e.target.value)} className="input" placeholder="اختياري" />
          </FieldWrap>
          <FieldWrap label="ملاحظات">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="اختياري" />
          </FieldWrap>
        </div>

        {amount && (
          <div className="mt-4 rounded-2xl bg-brand-soft p-4">
            <p className="text-xs text-muted-foreground">الباقي بعد القبض</p>
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
          {saving ? "جاري الحفظ..." : "تأكيد القبض"}
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
  const styles =
    status === "overdue"
      ? "bg-danger-soft text-danger"
      : status === "unpaid"
        ? "bg-surface-inset text-muted-foreground"
        : "bg-brand-soft text-brand";

  return <span className={"rounded-full px-3 py-1 text-xs font-bold " + styles}>{STATUS_LABELS[status]}</span>;
}
