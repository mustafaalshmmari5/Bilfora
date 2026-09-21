"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Moon,
  Palette,
  ReceiptText,
  Sun,
  WalletCards,
  X,
} from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";
import { applyAccentColor } from "@/lib/appearance";

type NotificationRow = {
  id: string;
  company_id: string | null;
  receivable_id: string | null;
  payment_id: string | null;
  kind: "receivable_created" | "payment_received" | "due_soon";
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

const toLatinDigits = (value: string | number) =>
  String(value)
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

const kindIcon = {
  receivable_created: ReceiptText,
  payment_received: WalletCards,
  due_soon: Clock3,
};

const COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#475569",
];

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [panel, setPanel] = useState<"notifications" | "appearance" | null>(null);
  const [busy, setBusy] = useState(false);
  const [accent, setAccent] = useState("#0f766e");
  const [dark, setDark] = useState(false);
  const mounted = useRef(false);

  const load = useCallback(async () => {
    if (!mounted.current) return;

    await supabasePersistent.rpc("spc_sync_due_notifications");

    const { data } = await supabasePersistent
      .from("spc_notifications")
      .select("id,company_id,receivable_id,payment_id,kind,title,body,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (mounted.current) setItems((data ?? []) as NotificationRow[]);
  }, []);

  useEffect(() => {
    mounted.current = true;
    setAccent(localStorage.getItem("spc-accent") || "#0f766e");
    setDark(document.documentElement.classList.contains("dark"));
    void load();

    const onMovement = () => void load();
    window.addEventListener("spc-movement-created", onMovement);

    const interval = window.setInterval(() => {
      void load();
    }, 60000);

    return () => {
      mounted.current = false;
      window.removeEventListener("spc-movement-created", onMovement);
      window.clearInterval(interval);
    };
  }, [load]);

  const unread = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  const markOne = async (id: string) => {
    const now = new Date().toISOString();
    await supabasePersistent
      .from("spc_notifications")
      .update({ read_at: now })
      .eq("id", id);

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read_at: now } : item))
    );
  };

  const markAll = async () => {
    setBusy(true);
    await supabasePersistent
      .from("spc_notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    await load();
    setBusy(false);
  };

  const saveAppearance = async (nextAccent?: string, nextDark?: boolean) => {
    const color = nextAccent ?? accent;
    const modeDark = nextDark ?? dark;

    const { data } = await supabasePersistent.auth.getUser();
    if (!data.user) return;

    await supabasePersistent
      .from("profiles")
      .update({
        accent_color: color,
        theme_mode: modeDark ? "dark" : "light",
      })
      .eq("id", data.user.id);
  };

  const chooseColor = (color: string) => {
    setAccent(color);
    applyAccentColor(color);
    void saveAppearance(color, dark);
  };

  const chooseTheme = (nextDark: boolean) => {
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("spc-theme", nextDark ? "dark" : "light");
    void saveAppearance(accent, nextDark);
  };

  return (
    <div className="fixed left-4 top-4 z-[70] md:left-8 md:top-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPanel(panel === "notifications" ? null : "notifications")}
          className={"relative flex h-11 w-11 items-center justify-center rounded-2xl border border-brand bg-brand text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-hover " + (unread > 0 ? "ring-4 ring-brand-soft" : "")}
          aria-label="الإشعارات"
          title="الإشعارات"
        >
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-black text-white">
              {unread > 99 ? "99+" : toLatinDigits(unread)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPanel(panel === "appearance" ? null : "appearance")}
          className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-border text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl" style={{ background: "conic-gradient(from 210deg, #7c3aed, #2563eb, #0891b2, #16a34a, #eab308, #ea580c, #db2777, #7c3aed)" }}
          aria-label="المظهر والألوان"
          title="المظهر والألوان"
        >
          <Palette size={20} className="drop-shadow-sm" />
        </button>
      </div>

      {panel && (
        <>
          <button
            aria-label="إغلاق القائمة"
            className="fixed inset-0 z-[-1] cursor-default"
            onClick={() => setPanel(null)}
          />

          {panel === "notifications" ? (
            <div className="mt-2 w-[min(92vw,390px)] overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="font-black">الإشعارات</h2>
                  <p className="text-xs text-muted-foreground">
                    {unread ? toLatinDigits(unread) + " غير مقروء" : "كلشي مقروء"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={markAll}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold text-brand hover:bg-brand-soft disabled:opacity-60"
                    >
                      <CheckCheck size={15} />
                      قراءة الكل
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPanel(null)}
                    className="rounded-xl p-2 hover:bg-surface-2"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="max-h-[65vh] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    ماكو إشعارات حالياً.
                  </div>
                ) : (
                  items.map((item) => {
                    const Icon = kindIcon[item.kind] ?? Bell;
                    const href = item.company_id
                      ? "/dashboard/companies/" + item.company_id
                      : "/dashboard";

                    return (
                      <Link
                        key={item.id}
                        href={href}
                        onClick={() => {
                          void markOne(item.id);
                          setPanel(null);
                        }}
                        className={
                          "flex gap-3 border-b border-border p-4 transition last:border-b-0 hover:bg-surface-2 " +
                          (!item.read_at ? "bg-brand-soft/60" : "")
                        }
                      >
                        <div
                          className={
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                            (item.kind === "due_soon"
                              ? "bg-warning-soft text-warning"
                              : item.kind === "payment_received"
                                ? "bg-brand-soft text-brand"
                                : "bg-brand-soft text-brand")
                          }
                        >
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-black">{toLatinDigits(item.title)}</p>
                            {!item.read_at && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                            )}
                          </div>
                          {item.body && (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {toLatinDigits(item.body)}
                            </p>
                          )}
                          <p className="mt-2 text-[10px] text-subtle">
                            {new Date(item.created_at).toLocaleString("en-GB", {
                              dateStyle: "short",
                              timeStyle: "short",
                              hour12: false,
                            })}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2 w-64 rounded-3xl border border-border bg-surface p-4 shadow-2xl">
              <div className="mb-4">
                <h2 className="font-black">المظهر</h2>
                <p className="mt-1 text-xs text-muted-foreground">تغيير سريع للواجهة</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => chooseTheme(false)}
                  className={
                    "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold " +
                    (!dark
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border bg-surface-2")
                  }
                >
                  <Sun size={15} />
                  نهاري
                </button>
                <button
                  type="button"
                  onClick={() => chooseTheme(true)}
                  className={
                    "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold " +
                    (dark
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border bg-surface-2")
                  }
                >
                  <Moon size={15} />
                  ليلي
                </button>
              </div>

              <div className="my-4 h-px bg-border" />

              <p className="mb-3 text-xs font-bold text-muted-foreground">لون الواجهة</p>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => chooseColor(color)}
                    className="relative h-10 rounded-xl border-2 border-surface shadow-sm ring-1 ring-border transition hover:scale-105"
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {accent.toLowerCase() === color.toLowerCase() && (
                      <Check className="absolute inset-0 m-auto text-white drop-shadow" size={17} />
                    )}
                  </button>
                ))}
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setPanel(null)}
                className="mt-4 block rounded-xl bg-surface-2 px-3 py-2.5 text-center text-xs font-bold text-brand hover:bg-brand-soft"
              >
                إعدادات المظهر الكاملة
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
