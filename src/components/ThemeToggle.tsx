"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("spc-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-inset",
        compact && "h-10 w-10 p-0",
        className
      )}
      aria-label={dark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={dark ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      {!compact && <span>{dark ? "نهاري" : "ليلي"}</span>}
    </button>
  );
}
