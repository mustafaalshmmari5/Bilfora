"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Clock3, ReceiptText, WalletCards, X } from "lucide-react";
import { supabasePersistent } from "@/lib/supabase-clients";

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

const kindIcon = {
  receivable_created: ReceiptText,
  payment_received: WalletCards,
  due_soon: Clock3,
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
    await supabasePersistent
      .from("spc_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      )
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

  return (
    <div className="fixed left-4 top-4 z-[60] md:left-8 md:top-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface shadow-lg transition hover:bg-surface-2"
        aria-label="الإشعارات"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-black text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="إغلاق الإشعارات"
            className="fixed inset-0 z-[-1] cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="mt-2 w-[min(92vw,390px)] overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-black">الإشعارات</h2>
                <p className="text-xs text-muted-foreground">
                  {unread ? unread + " غير مقروء" : "كلشي مقروء"}
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
                  onClick={() => setOpen(false)}
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
                        setOpen(false);
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
                              ? "bg-success-soft text-success"
                              : "bg-brand-soft text-brand")
                        }
                      >
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black">{item.title}</p>
                          {!item.read_at && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                          )}
                        </div>
                        {item.body && (
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {item.body}
                          </p>
                        )}
                        <p className="mt-2 text-[10px] text-subtle">
                          {new Date(item.created_at).toLocaleString("ar-IQ", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
