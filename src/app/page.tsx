import { Metadata } from "next";
import MarketingLanding from "@/components/landing-page/MarketingLanding";

export const metadata: Metadata = {
	title: "نظام حسابات SPC",
	description: "نظام حسابات SPC لإدارة الحسابات والفواتير والمدفوعات.",
	keywords: ["نظام حسابات SPC", "محاسبة", "فواتير", "مدفوعات", "SPC"],
	openGraph: {
		title: "نظام حسابات SPC",
		description: "نظام حسابات SPC لإدارة الحسابات والفواتير والمدفوعات.",
		type: "website",
		locale: "ar_IQ",
	},
};

export default function Home() {
	return <MarketingLanding />;
}
