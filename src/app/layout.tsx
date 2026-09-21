import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { thmanyahSans, thmanyahSerifText, thmanyahSerifDisplay } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/providers/QueryProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { Analytics } from "@vercel/analytics/react";
import LatinDigitsGuard from "@/components/LatinDigitsGuard";

export const metadata: Metadata = {
  title: "نظام حسابات SPC",
  description: "نظام داخلي لمتابعة حسابات الشركات والاستحقاقات والمقبوضات والأرصدة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar-u-nu-latn"
      dir="rtl"
      className={`scroll-smooth ${thmanyahSans.variable} ${thmanyahSerifText.variable} ${thmanyahSerifDisplay.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('spc-theme');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <LatinDigitsGuard />
        <QueryProvider>
          <MotionProvider>
            {children}
            <Toaster />
            <Analytics />
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                  strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                  `}
                </Script>
              </>
            )}
          </MotionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
