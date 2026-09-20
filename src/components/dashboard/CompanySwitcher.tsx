"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Search, UserRound, X } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";

type CompanyOption = {
  id: string;
  name: string;
  sap_code: string;
  party_type: "company" | "person";
};

export default function CompanySwitcher({
  currentCompanyId,
}: {
  currentCompanyId?: string;
}) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabasePersistent
        .from("spc_company_balances")
        .select("id,name,sap_code,party_type")
        .order("name");

      setCompanies((data ?? []) as CompanyOption[]);
    };

    void load();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const current = companies.find((company) => company.id === currentCompanyId);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return companies;

    return companies.filter((company) =>
      (company.name + " " + company.sap_code).toLowerCase().includes(text)
    );
  }, [companies, query]);

  return (
    <div ref={boxRef} className="relative" dir="rtl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setQuery("");
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-brand/30 bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand shadow-sm transition hover:border-brand hover:bg-brand-soft-2"
        >
          <Search size={17} />
          بحث عن جهة
        </button>

        {current && (
          <span className="inline-flex max-w-[230px] items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm font-black shadow-sm">
            <Building2 size={16} className="shrink-0 text-brand" />
            <span className="truncate">{current.name}</span>
          </span>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-[min(92vw,360px)] overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="اسم الشركة/الشخص أو رقم SAP..."
                className="input pr-9 pl-10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2"
                  aria-label="مسح البحث"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                ماكو جهة بهذا الاسم أو رقم SAP.
              </div>
            ) : (
              <>
                {(["company", "person"] as const).map((group) => {
                  const groupItems = filtered.filter((item) => item.party_type === group);
                  if (groupItems.length === 0) return null;

                  return (
                    <div key={group} className="mb-2 last:mb-0">
                      <div className="px-3 py-2 text-[11px] font-black text-muted-foreground">
                        {group === "company" ? "الشركات" : "الأشخاص"}
                      </div>
                      {groupItems.map((company) => {
                        const Icon = company.party_type === "person" ? UserRound : Building2;
                        return (
                          <Link
                            key={company.id}
                            href={"/dashboard/companies/" + company.id}
                            onClick={() => setOpen(false)}
                            className={
                              "flex items-center justify-between gap-3 rounded-2xl px-3 py-3 transition hover:bg-brand-soft " +
                              (company.id === currentCompanyId ? "bg-brand-soft text-brand" : "")
                            }
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black">{company.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{company.sap_code}</p>
                            </div>
                            <Icon size={17} className="shrink-0 text-brand" />
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
