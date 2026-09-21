"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabasePersistent, supabaseSession } from "@/lib/supabase-clients";
import { LayoutDashboard, Building2, BellRing, Settings, LogOut, ChevronRight, ChevronLeft, Menu } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { useSidebar } from "./sidebar/SidebarContext";
import { SidebarLogoutModal } from "./sidebar/SidebarLogoutModal";
import { SidebarNavItem } from "./sidebar/SidebarNavItem";
import { SidebarTooltip } from "./sidebar/SidebarTooltip";
import { applyAccentColor } from "@/lib/appearance";

export default function Sidebar() {
  const { toast } = useToast();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
    setMounted(true);
  }, [setIsCollapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    if (!isCollapsed) setHoveredItem(null);
  }, [isCollapsed]);

  useEffect(() => {
    const loadAppearance = async () => {
      const { data: auth } = await supabasePersistent.auth.getUser();
      if (!auth.user) return;

      const { data } = await supabasePersistent
        .from("profiles")
        .select("accent_color, theme_mode")
        .eq("id", auth.user.id)
        .single();

      if (!data) return;

      const mode = data.theme_mode === "dark" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", mode === "dark");
      localStorage.setItem("spc-theme", mode);

      const color = data.accent_color || "#0f766e";
      applyAccentColor(color);
    };

    loadAppearance();
  }, []);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try { await Promise.all([supabasePersistent.auth.signOut(), supabaseSession.auth.signOut()]); }
    finally {
      setIsLoggingOut(false); setIsLogoutOpen(false);
      toast({ title: "تم تسجيل الخروج", description: "نراك قريبًا 👋" });
      router.replace("/login");
    }
  };

  const handleHover = (e: React.MouseEvent<HTMLElement>, label: string) => {
    if (isCollapsed) { const rect = e.currentTarget.getBoundingClientRect(); setHoveredItem({ label, top: rect.top + rect.height / 2 }); }
  };

  const items = [
    { href:"/dashboard", label:"لوحة التحكم", icon:LayoutDashboard },
    { href:"/dashboard/companies", label:"الشركات والحسابات", icon:Building2 },
  ];

  return <>
    <button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} className="fixed top-4 right-4 z-50 rounded-xl border border-border bg-surface/90 p-2.5 shadow-lg md:hidden"><Menu size={24}/></button>
    <m.aside animate={{width:isCollapsed?80:264}} className={cn("fixed top-0 right-0 z-40 flex h-screen flex-col border-l border-border bg-surface/95 shadow-2xl backdrop-blur-xl transition-transform",isMobileMenuOpen?"translate-x-0":"translate-x-full md:translate-x-0")}>
      <div className={cn("flex items-center border-b border-border p-6",isCollapsed?"justify-center":"justify-between")}>
        {isCollapsed ? <button onClick={()=>setIsCollapsed(false)} className="flex flex-col items-center gap-1"><Logo variant="symbol" size={26}/><ChevronLeft size={14}/></button> :
          <><Link href="/dashboard" className="flex items-center"><img src="/spc-logo.svg" alt="SPC - Solution Portal Company" className="h-auto w-[150px] object-contain" /></Link><button onClick={()=>setIsCollapsed(true)} className="hidden rounded-xl p-2 hover:bg-surface-2 md:block"><ChevronRight size={20}/></button></>}
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {!isCollapsed&&<p className="px-4 pb-2 text-xs font-semibold text-muted-foreground">نظام حسابات SPC</p>}
        {items.map(({href,label,icon})=><SidebarNavItem key={href} href={href} label={label} icon={icon} active={pathname===href||(href!=="/dashboard"&&pathname.startsWith(href+"/"))} isCollapsed={isCollapsed} onClick={()=>setIsMobileMenuOpen(false)} onMouseEnter={e=>handleHover(e,label)} onMouseLeave={()=>setHoveredItem(null)}/>)}
        <div className="my-4 border-t border-border"/>
        <SidebarNavItem href="/dashboard/settings" label="الإعدادات" icon={Settings} active={pathname.startsWith("/dashboard/settings")} isCollapsed={isCollapsed} onClick={()=>setIsMobileMenuOpen(false)} onMouseEnter={e=>handleHover(e,"الإعدادات")} onMouseLeave={()=>setHoveredItem(null)}/>
      </nav>
      <div className="border-t border-border bg-surface-2 p-4 space-y-2">
        <div className={cn("flex items-center rounded-2xl border border-border bg-surface p-2.5 shadow-sm",isCollapsed?"justify-center":"gap-3")}>
          <div className="relative shrink-0">
            <img src="/mustafa-profile-v3.jpg" alt="mustafa" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-soft" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500" />
          </div>
          {!isCollapsed&&<span className="truncate text-sm font-black">mustafa</span>}
        </div>
        <button onClick={()=>setIsLogoutOpen(true)} onMouseEnter={e=>handleHover(e,"تسجيل الخروج")} onMouseLeave={()=>setHoveredItem(null)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-danger hover:bg-danger-soft"><LogOut size={isCollapsed?22:18}/>{!isCollapsed&&<span>تسجيل الخروج</span>}</button>
      </div>
    </m.aside>
    <AnimatePresence>{isMobileMenuOpen&&<m.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsMobileMenuOpen(false)} className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"/>}</AnimatePresence>
    <SidebarTooltip isCollapsed={isCollapsed} hoveredItem={hoveredItem} mounted={mounted}/>
    <SidebarLogoutModal isOpen={isLogoutOpen} isLoggingOut={isLoggingOut} onClose={()=>setIsLogoutOpen(false)} onConfirm={confirmLogout}/>
  </>;
}
