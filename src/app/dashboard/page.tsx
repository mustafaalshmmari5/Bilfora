"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, WalletCards, BanknoteArrowDown, CircleDollarSign, Search, Plus, BellRing, ArrowLeft } from "lucide-react";
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

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: currency === "IQD" ? 0 : 2 }).format(value) +
  " " + currency;

export default function DashboardPage() {
  const [companies, setCompanies] = useState<CompanyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabasePersistent
        .from("spc_company_balances")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!error) setCompanies((data ?? []) as CompanyBalance[]);
      setLoading(false);
    };
    load();
  }, []);

  const totals = useMemo(() => {
    return companies.reduce(
      (acc, c) => {
        const due = Number(c.total_due || 0);
        const paid = Number(c.total_paid || 0);
        const bal = Number(c.balance || 0);
        acc.due += due;
        acc.paid += paid;
        acc.balance += bal;
        if (bal > 0) acc.open += 1;
        return acc;
      },
      { due: 0, paid: 0, balance: 0, open: 0 }
    );
  }, [companies]);

  const filtered = companies.filter((c) =>
    [c.name, c.sap_code, c.main_service ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="space-y-7 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">لوحة حسابات الشركات</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            متابعة الاستحقاقات، المقبوضات، الأرصدة والتذكيرات من مكان واحد.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="إجمالي الاستحقاقات" value={totals.due} icon={WalletCards} />
        <StatCard title="إجمالي المقبوض" value={totals.paid} icon={BanknoteArrowDown} />
        <StatCard title="الرصيد المتبقي" value={totals.balance} icon={CircleDollarSign} important />
        <StatCard title="شركات عليها رصيد" value={totals.open} icon={Building2} count />
      </div>

      <div className="rounded-3xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">حسابات الشركات</h2>
            <p className="text-sm text-muted-foreground">اضغط على أي شركة لفتح كشف حسابها.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالاسم أو رقم SAP أو الخدمة"
              className="w-full rounded-2xl border border-border bg-surface-2 py-3 pr-11 pl-4 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground">جاري تحميل الحسابات...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto mb-3 text-muted-foreground" size={42} />
            <p className="font-bold">ماكو شركات مسجلة حالياً</p>
            <p className="mt-1 text-sm text-muted-foreground">ابدأ بإضافة أول شركة ورقم SAP مالها.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((company) => {
              const balance = Number(company.balance || 0);
              return (
                <Link
                  key={company.id}
                  href={"/dashboard/companies/" + company.id}
                  className="grid grid-cols-1 gap-4 p-5 transition hover:bg-surface-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-brand/10 p-2 text-brand"><Building2 size={18} /></div>
                      <div>
                        <p className="font-bold">{company.name}</p>
                        <p className="text-xs text-muted-foreground">SAP: {company.sap_code}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الخدمة</p>
                    <p className="mt-1 text-sm font-medium">{company.main_service || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المطلوب</p>
                    <p className="mt-1 text-sm font-bold">{money(Number(company.total_due || 0), company.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الباقي</p>
                    <p className={"mt-1 text-sm font-black " + (balance > 0 ? "text-amber-600" : "text-emerald-600")}>
                      {money(balance, company.currency)}
                    </p>
                    {company.next_reminder_date && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <BellRing size={11} /> {company.next_reminder_date}
                      </p>
                    )}
                  </div>
                  <ArrowLeft className="text-muted-foreground" size={18} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, important, count }: { title: string; value: number; icon: any; important?: boolean; count?: boolean }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={"rounded-2xl p-3 " + (important ? "bg-amber-50 text-amber-600" : "bg-brand/10 text-brand")}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-black">
        {count ? new Intl.NumberFormat("ar-IQ").format(value) : new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 0 }).format(value)}
        {!count && <span className="mr-1 text-xs font-medium text-muted-foreground">IQD*</span>}
      </p>
      {!count && <p className="mt-1 text-[10px] text-muted-foreground">* ملخص رقمي؛ العملات تظهر منفصلة داخل حساب الشركة.</p>}
    </div>
  );
}
