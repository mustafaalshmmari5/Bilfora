"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BanknoteArrowDown,
  BellRing,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Plus,
  Search,
  WalletCards,
} from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";

type CompanyBalance = {
  id: string;
  name: string;
  sap_code: string;
  main_service: string | null;
  currency: "IQD" | "USD";
  total_due: number | string;
  total_paid: number | string;
  balance: number | string;
  next_reminder_date: string | null;
};

type ReceivableStatus = {
  id: string;
  company_id: string;
  outstanding_amount: number | string;
  due_date: string | null;
  is_overdue: boolean;
  is_due_soon: boolean;
};

type Reminder = {
  id: string;
  company_id: string;
  remind_on: string;
  title: string;
  is_done: boolean;
};

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("ar-IQ", {
    maximumFractionDigits: currency === "IQD" ? 0 : 2,
  }).format(value) + " " + currency;

export default function DashboardPage() {
  const [companies, setCompanies] = useState<CompanyBalance[]>([]);
  const [receivables, setReceivables] = useState<ReceivableStatus[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const [companiesResult, receivablesResult, remindersResult] = await Promise.all([
        supabasePersistent
          .from("spc_company_balances")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabasePersistent
          .from("spc_receivable_status")
          .select("id,company_id,outstanding_amount,due_date,is_overdue,is_due_soon"),
        supabasePersistent
          .from("spc_reminders")
          .select("id,company_id,remind_on,title,is_done")
          .eq("is_done", false)
          .order("remind_on", { ascending: true }),
      ]);

      if (!companiesResult.error) setCompanies((companiesResult.data ?? []) as CompanyBalance[]);
      if (!receivablesResult.error) setReceivables((receivablesResult.data ?? []) as ReceivableStatus[]);
      if (!remindersResult.error) setReminders((remindersResult.data ?? []) as Reminder[]);
      setLoading(false);
    };

    load();
  }, []);

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  );

  const summaries = useMemo(() => {
    const make = () => ({ due: 0, paid: 0, balance: 0, overdue: 0, dueSoon: 0 });
    const byCurrency: Record<string, ReturnType<typeof make>> = {
      IQD: make(),
      USD: make(),
    };

    companies.forEach((company) => {
      const currency = company.currency || "IQD";
      const bucket = byCurrency[currency] ?? (byCurrency[currency] = make());
      bucket.due += Number(company.total_due || 0);
      bucket.paid += Number(company.total_paid || 0);
      bucket.balance += Number(company.balance || 0);
    });

    receivables.forEach((item) => {
      const company = companyMap.get(item.company_id);
      if (!company) return;
      const bucket = byCurrency[company.currency];
      const amount = Number(item.outstanding_amount || 0);
      if (item.is_overdue) bucket.overdue += amount;
      if (item.is_due_soon) bucket.dueSoon += amount;
    });

    return byCurrency;
  }, [companies, receivables, companyMap]);

  const attentionCompanies = useMemo(() => {
    const stats = new Map<string, { overdue: number; dueSoon: number; nextDue: string | null }>();

    receivables.forEach((item) => {
      if (!item.is_overdue && !item.is_due_soon) return;
      const current = stats.get(item.company_id) ?? { overdue: 0, dueSoon: 0, nextDue: null };
      const amount = Number(item.outstanding_amount || 0);
      if (item.is_overdue) current.overdue += amount;
      if (item.is_due_soon) current.dueSoon += amount;
      if (item.due_date && (!current.nextDue || item.due_date < current.nextDue)) current.nextDue = item.due_date;
      stats.set(item.company_id, current);
    });

    return Array.from(stats.entries())
      .map(([companyId, status]) => ({ company: companyMap.get(companyId), ...status }))
      .filter((row) => row.company)
      .sort((a, b) => b.overdue - a.overdue || b.dueSoon - a.dueSoon)
      .slice(0, 6);
  }, [receivables, companyMap]);

  const filtered = companies.filter((company) =>
    [company.name, company.sap_code, company.main_service ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const activeReminders = reminders.slice(0, 5);

  return (
    <div className="space-y-7 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">متابعة حسابات الشركات</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            نظرة مباشرة على المتأخرات، المقبوضات، الأرصدة ومواعيد المتابعة.
          </p>
        </div>
        <Link
          href="/dashboard/companies?new=1"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
        >
          <Plus size={18} />
          إضافة شركة
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(["IQD", "USD"] as const).map((currency) => (
          <div key={currency} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ملخص {currency}</p>
                <h2 className="text-lg font-black">{currency === "IQD" ? "الدينار العراقي" : "الدولار"}</h2>
              </div>
              <CircleDollarSign className="text-brand" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Metric label="المطلوب" value={money(summaries[currency].due, currency)} icon={WalletCards} />
              <Metric label="المقبوض" value={money(summaries[currency].paid, currency)} icon={BanknoteArrowDown} success />
              <Metric label="الباقي" value={money(summaries[currency].balance, currency)} icon={CircleDollarSign} />
              <Metric label="متأخر" value={money(summaries[currency].overdue, currency)} icon={AlertTriangle} danger />
              <Metric label="خلال 7 أيام" value={money(summaries[currency].dueSoon, currency)} icon={CalendarClock} warning />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="text-xl font-black">تحتاج متابعة</h2>
            <p className="mt-1 text-sm text-muted-foreground">الشركات المتأخرة أو اللي موعدها قريب.</p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : attentionCompanies.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">ماكو مبالغ متأخرة أو قريبة حالياً.</div>
          ) : (
            <div className="divide-y divide-border">
              {attentionCompanies.map(({ company, overdue, dueSoon, nextDue }) => company && (
                <Link
                  key={company.id}
                  href={"/dashboard/companies/" + company.id}
                  className="grid grid-cols-1 gap-3 p-5 transition hover:bg-surface-2 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-black">{company.name}</p>
                    <p className="text-xs text-muted-foreground">SAP: {company.sap_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">متأخر</p>
                    <p className="mt-1 font-black text-red-600">{money(overdue, company.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">قريب</p>
                    <p className="mt-1 font-bold text-amber-600">{money(dueSoon, company.currency)}</p>
                    {nextDue && <p className="mt-1 text-[11px] text-muted-foreground">{nextDue}</p>}
                  </div>
                  <ArrowLeft size={18} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="flex items-center gap-2 text-xl font-black"><BellRing size={20} /> التذكيرات</h2>
          </div>
          {activeReminders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">ماكو تذكيرات مفتوحة.</div>
          ) : (
            <div className="divide-y divide-border">
              {activeReminders.map((reminder) => {
                const company = companyMap.get(reminder.company_id);
                return (
                  <Link key={reminder.id} href={"/dashboard/companies/" + reminder.company_id} className="block p-4 hover:bg-surface-2">
                    <p className="font-bold">{company?.name ?? "شركة"}</p>
                    <p className="mt-1 text-sm">{reminder.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{reminder.remind_on}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">كل الشركات</h2>
            <p className="text-sm text-muted-foreground">الرصيد الحالي لكل شركة.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالاسم أو SAP أو الخدمة"
              className="w-full rounded-2xl border border-border bg-surface-2 py-3 pr-11 pl-4 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="mx-auto mb-3 text-muted-foreground" size={40} />
            <p className="font-bold">ماكو شركات مسجلة حالياً</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((company) => (
              <Link
                key={company.id}
                href={"/dashboard/companies/" + company.id}
                className="grid grid-cols-1 gap-4 p-5 hover:bg-surface-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center"
              >
                <div>
                  <p className="font-black">{company.name}</p>
                  <p className="text-xs text-muted-foreground">SAP: {company.sap_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الخدمة</p>
                  <p className="mt-1 text-sm font-medium">{company.main_service || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المطلوب</p>
                  <p className="mt-1 font-bold">{money(Number(company.total_due || 0), company.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الباقي</p>
                  <p className={"mt-1 font-black " + (Number(company.balance) > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {money(Number(company.balance || 0), company.currency)}
                  </p>
                </div>
                <ArrowLeft size={18} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  success,
  danger,
  warning,
}: {
  label: string;
  value: string;
  icon: any;
  success?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  const tone = danger
    ? "text-red-600 bg-red-50"
    : warning
      ? "text-amber-600 bg-amber-50"
      : success
        ? "text-emerald-600 bg-emerald-50"
        : "text-brand bg-brand/10";

  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className={"mb-3 inline-flex rounded-xl p-2 " + tone}><Icon size={16} /></div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black break-words">{value}</p>
    </div>
  );
}
