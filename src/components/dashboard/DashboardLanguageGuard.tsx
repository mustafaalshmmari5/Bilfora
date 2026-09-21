"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/language";

const UI_TRANSLATIONS: Record<string, string> = {
  "لوحة التحكم": "Dashboard",
  "الشركات والحسابات": "Companies & Accounts",
  "نظام حسابات SPC": "SPC Accounts System",
  "الإعدادات": "Settings",
  "تسجيل الخروج": "Logout",
  "تم تسجيل الخروج": "Signed out",
  "نراك قريبًا 👋": "See you soon 👋",
  "مستحقات الشركات التابعة إلى SPC": "SPC Company Receivables",
  "إضافة حركة سريعة": "Quick Entry",
  "سجل الحركات": "Movement History",
  "نوع الحركة": "Movement Type",
  "الشركة / SAP": "Company / SAP",
  "التاريخ": "Date",
  "تاريخ الاستحقاق": "Due Date",
  "المرجع": "Reference",
  "الخدمة / البيان": "Service / Description",
  "المستلم الآن": "Received Now",
  "الباقي تلقائياً": "Remaining Automatically",
  "ملاحظات": "Notes",
  "إضافة الحركة": "Add Movement",
  "جاري الحفظ...": "Saving...",
  "اختار الشركة": "Select Company",
  "كل الأنواع": "All Types",
  "كل الحالات": "All Statuses",
  "كل الشركات": "All Companies",
  "كل الأشخاص": "All People",
  "جاري تحميل الحركات...": "Loading movements...",
  "ماكو حركات حالياً": "No movements yet",
  "النوع": "Type",
  "الحالة": "Status",
  "إجراء": "Action",
  "طلب": "Order",
  "استحقاق": "Receivable",
  "مصروف / خدمة": "Expense / Service",
  "أخرى": "Other",
  "مسدد": "Paid",
  "جزئي": "Partial",
  "غير مسدد": "Unpaid",
  "متأخر": "Overdue",
  "المطلوب": "Due",
  "المستلم": "Received",
  "الباقي": "Remaining",
  "الدينار العراقي": "Iraqi Dinar",
  "الدولار": "US Dollar",
  "الشركة": "Company",
  "تسجيل قبض": "Record Payment",
  "استلام": "Receipt",
  "مبلغ القبض": "Payment Amount",
  "رقم المرجع": "Reference Number",
  "اختياري": "Optional",
  "تأكيد القبض": "Confirm Payment",
  "الباقي حالياً": "Current Balance",
  "المستلم سابقاً": "Previously Received",
  "الباقي بعد القبض": "Balance After Payment",
  "بحث...": "Search...",
  "ابحث عن شركة...": "Search for a company...",
  "الشركات": "Companies",
  "سجل كل شركة ورقم SAP والخدمة، وبعدها تابع حسابها.": "Add each company, SAP code and service, then track its account.",
  "إضافة شركة جديدة": "Add New Company",
  "المعلومات الأساسية فقط، والباقي تضيفه لاحقاً.": "Add the basic information now; you can complete the rest later.",
  "اسم الشركة*": "Company Name*",
  "رقم SAP*": "SAP Code*",
  "الخدمة الرئيسية": "Main Service",
  "العملة": "Currency",
  "رقم الهاتف": "Phone Number",
  "حفظ الشركة": "Save Company",
  "بدون خدمة محددة": "No service specified",
  "المقبوض": "Received",
  "IQD - دينار عراقي": "IQD - Iraqi Dinar",
  "USD - دولار": "USD - US Dollar",
  "USD - دولار أمريكي": "USD - US Dollar",
  "جاري تحميل الحساب...": "Loading account...",
  "الشركة غير موجودة.": "Company not found.",
  "رجوع للشركات": "Back to Companies",
  "رقم SAP:": "SAP No.:",
  "الخدمة:": "Service:",
  "إضافة استحقاق": "Add Receivable",
  "تذكير": "Reminder",
  "إجمالي المطلوب": "Total Due",
  "إجمالي المقبوض": "Total Received",
  "الباقي الحالي": "Current Balance",
  "كشف الحساب": "Account Statement",
  "كل استحقاق يزيد الرصيد، وكل قبض ينقصه مباشرة.": "Each receivable increases the balance and each payment reduces it immediately.",
  "ماكو حركات بعد. أضف أول استحقاق.": "No movements yet. Add the first receivable.",
  "البيان": "Description",
  "المبلغ": "Amount",
  "الرصيد بعد الحركة": "Balance After Movement",
  "قبض": "Payment",
  "تحويل": "Transfer",
  "متابعة تحصيل": "Collection Follow-up",
  "إضافة تذكير": "Add Reminder",
  "يزيد الرصيد تلقائياً": "Increases the balance automatically",
  "ينقص من الرصيد مباشرة": "Reduces the balance immediately",
  "حتى ما تنسى المتابعة": "So you don't miss the follow-up",
  "الخدمة / البيان*": "Service / Description*",
  "طريقة القبض": "Payment Method",
  "عنوان التذكير": "Reminder Title",
  "تاريخ التذكير": "Reminder Date",
  "تاريخ الحركة": "Movement Date",
  "رقم المرجع (اختياري)": "Reference Number (Optional)",
  "حفظ الحركة": "Save Movement",
  "الإشعارات": "Notifications",
  "المظهر والألوان": "Appearance & Colors",
  "التحويل إلى الإنجليزية": "Switch to English",
  "إغلاق القائمة": "Close Menu",
  "غير مقروء": "Unread",
  "كلشي مقروء": "All Read",
  "قراءة الكل": "Mark All Read",
  "ماكو إشعارات حالياً.": "No notifications right now.",
  "المظهر": "Appearance",
  "تغيير سريع للواجهة": "Quick appearance settings",
  "نهاري": "Light",
  "ليلي": "Dark",
  "لون الواجهة": "Accent Color",
  "إعدادات المظهر الكاملة": "Full Appearance Settings",
  "بحث عن جهة": "Search Entity",
  "اسم الشركة/الشخص أو رقم SAP...": "Company/person name or SAP code...",
  "مسح البحث": "Clear Search",
  "الأشخاص": "People",
  "ماكو جهة بهذا الاسم أو رقم SAP.": "No entity found with this name or SAP code.",
  "جاري تحميل الإعدادات...": "Loading settings...",
  "خصّص شكل نظام حسابات SPC حسب ذوقك.": "Customize the SPC Accounts System appearance.",
  "تم حفظ إعدادات المظهر لحسابك ✓": "Appearance settings saved ✓",
  "الفواتير": "Invoices",
  "إعدادات ترقيم الفواتير، العملة والملاحظات.": "Invoice numbering, currency and notes settings.",
  "المستخدم": "User",
  "إعدادات المظهر الخاصة بحسابك": "Your account appearance settings",
  "الوضع": "Theme",
  "اختار نهاري أو ليلي.": "Choose light or dark mode.",
  "لون النظام": "System Color",
  "اختار لون جاهز أو حدد أي لون يعجبك.": "Choose a preset color or pick your own.",
  "لون مخصص": "Custom Color",
  "حفظ المظهر": "Save Appearance",
  "جاري تحميل إعدادات الفواتير...": "Loading invoice settings...",
  "إعدادات الفواتير": "Invoice Settings",
  "إعدادات خاصة بفواتير SPC.": "SPC invoice settings.",
  "تم حفظ إعدادات الفواتير ✓": "Invoice settings saved ✓",
  "بيانات الفاتورة": "Invoice Details",
  "اسم الشركة": "Company Name",
  "بادئة رقم الفاتورة": "Invoice Number Prefix",
  "العملة والملاحظات": "Currency & Notes",
  "العملة الافتراضية": "Default Currency",
  "ملاحظة أسفل الفاتورة": "Invoice Footer Note",
  "ملاحظات الدفع": "Payment Notes",
  "حفظ إعدادات الفواتير": "Save Invoice Settings",
  "رجوع للإعدادات": "Back to Settings",
  "تعذر تحميل الحساب.": "Unable to load account.",
  "انتهت الجلسة.": "Session expired.",
  "انتهت الجلسة. سجل دخول مرة ثانية.": "Session expired. Please sign in again.",
  "لازم تسجل دخول أولاً.": "You need to sign in first.",
  "رقم SAP مستخدم مسبقاً.": "SAP code is already in use.",
  "اختار الشركة أولاً.": "Select a company first.",
  "اكتب المبلغ المطلوب بشكل صحيح.": "Enter the due amount correctly.",
  "المبلغ المستلم لازم يكون بين صفر والمبلغ المطلوب.": "Received amount must be between zero and the due amount.",
  "تمت إضافة الحركة بنجاح ✓": "Movement added successfully ✓",
  "اكتب مبلغ القبض.": "Enter the payment amount.",
  "مبلغ القبض أكبر من الباقي على هذا السطر.": "Payment amount exceeds the remaining balance.",
  "تم تسجيل القبض وتحديث الرصيد ✓": "Payment recorded and balance updated ✓",
  "جاري التحقق من الهوية...": "Checking authentication...",
  "فشل الاتصال بالخادم": "Server Connection Failed",
  "لا يمكن الاتصال بخادم Supabase": "Unable to connect to Supabase",
  "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى": "Check your internet connection and try again.",
  "إعادة المحاولة": "Try Again",
  "العودة إلى صفحة تسجيل الدخول": "Back to Login",
  "استحقاق جديد": "New Receivable",
  "قبض جديد": "New Payment",
  "استحقاق قريب": "Due Soon",
  "تم إضافة استحقاق": "Receivable added",
  "تم تسجيل قبض": "Payment recorded"
};

const REVERSE = Object.fromEntries(Object.entries(UI_TRANSLATIONS).map(([ar, en]) => [en, ar]));

function translateText(value: string, lang: "ar" | "en") {
  if (!value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  const exact = lang === "en" ? UI_TRANSLATIONS[core] : REVERSE[core];
  if (exact) return leading + exact + trailing;

  let next = core;
  const pairs = Object.entries(UI_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
  if (lang === "en") {
    for (const [ar, en] of pairs) if (next.includes(ar)) next = next.split(ar).join(en);
  } else {
    for (const [ar, en] of pairs) if (next.includes(en)) next = next.split(en).join(ar);
  }
  return leading + next + trailing;
}

function translateElement(root: ParentNode, lang: "ar" | "en") {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
      const current = node.nodeValue ?? "";
      const next = translateText(current, lang);
      if (next !== current) node.nodeValue = next;
    }
    node = walker.nextNode();
  }

  const elements = root instanceof Element
    ? [root, ...Array.from(root.querySelectorAll("*"))]
    : Array.from(root.querySelectorAll("*"));

  for (const element of elements) {
    for (const attr of ["placeholder", "title", "aria-label"]) {
      const current = element.getAttribute(attr);
      if (!current) continue;
      const next = translateText(current, lang);
      if (next !== current) element.setAttribute(attr, next);
    }
  }
}

export default function DashboardLanguageGuard() {
  const { lang } = useLanguage();

  useEffect(() => {
    const root = document.querySelector("[data-spc-dashboard]");
    if (!root) return;

    translateElement(root, lang);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target instanceof Text) {
          const current = mutation.target.nodeValue ?? "";
          const next = translateText(current, lang);
          if (next !== current) mutation.target.nodeValue = next;
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof Text) {
            const current = node.nodeValue ?? "";
            const next = translateText(current, lang);
            if (next !== current) node.nodeValue = next;
          } else if (node instanceof Element) {
            translateElement(node, lang);
          }
        });
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [lang]);

  return null;
}
