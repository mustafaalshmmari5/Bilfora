"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabasePersistent, supabaseSession } from "@/lib/supabase-clients";
import Sidebar from "@/components/dashboard/sideBar";
import { useSidebar } from "@/components/dashboard/sidebar/SidebarContext";
import SidebarProvider from "@/components/dashboard/SidebarProvider";
import LoadingState from "@/components/LoadingState";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardLayoutWrapperProps {
	children: ReactNode;
}

// 🧩 Main dashboard content (responsive, RTL-aware)
function DashboardContent({ children }: { children: ReactNode }) {
	const { isCollapsed } = useSidebar();

	return (
		<main
			className={cn(
				"flex-1 min-h-screen bg-background transition-[margin] duration-300 w-full max-w-full overflow-x-hidden",
				isCollapsed ? "md:mr-[80px]" : "md:mr-[264px]"
			)}
		>
			<div className="p-4 md:p-8 pt-20 md:pt-8 max-w-[1600px] mx-auto">
				<m.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					{children}
				</m.div>
			</div>
		</main>
	);
}

// 🔒 Authentication wrapper
function AuthWrapper({ children }: { children: ReactNode }) {
	const [authChecked, setAuthChecked] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [connectionError, setConnectionError] = useState(false);
	const router = useRouter();

	// ✅ Check authentication once on mount
	// Check both persistent and session clients to find the active session
	const checkAuth = useCallback(async () => {
		try {
			setIsLoading(true);
			setConnectionError(false);

			// Check both clients to find active session (could be in localStorage or sessionStorage)
			// Check both clients in PARALLEL to eliminate waterfall
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error("Connection timeout")), 10000)
			);

			// Check both clients in parallel for faster auth verification
			const [persistentResult, sessionResult] = await Promise.race([
				Promise.all([
					supabasePersistent.auth.getUser(),
					supabaseSession.auth.getUser(),
				]),
				timeoutPromise.then(() => { throw new Error("Connection timeout"); }),
			]) as [{ data: { user: unknown }, error: unknown }, { data: { user: unknown }, error: unknown }];

			// Use whichever client has a user
			const user = persistentResult?.data?.user || sessionResult?.data?.user;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const error = (persistentResult as { error: any })?.error || (sessionResult as { error: any })?.error;

			// Check for network/connection errors
			if (error) {
				if (
					error.message?.includes("Failed to fetch") ||
					error.message?.includes("NetworkError") ||
					error.message?.includes("timeout") ||
					error.message?.includes("ERR_CONNECTION_TIMED_OUT")
				) {
					console.error("Network error during authentication check:", error);
					setConnectionError(true);
					setAuthChecked(false);
					return;
				}
				// For other auth errors, redirect to login
				router.replace("/login");
				return;
			}

			if (!user) {
				router.replace("/login");
				return;
			}
			setAuthChecked(true);
			setConnectionError(false);
		} catch (error: unknown) {
			console.error("Error checking authentication:", error);

			const err = error as { message?: string, name?: string };

			// Handle timeout and network errors gracefully
			if (
				err?.message?.includes("timeout") ||
				err?.message?.includes("Failed to fetch") ||
				err?.message?.includes("NetworkError") ||
				err?.message?.includes("ERR_CONNECTION_TIMED_OUT") ||
				err?.name === "TypeError"
			) {
				setConnectionError(true);
				setAuthChecked(false);
			} else {
				// For other errors, redirect to login
				router.replace("/login");
			}
		} finally {
			setIsLoading(false);
		}
	}, [router]);

	useEffect(() => {
		checkAuth();

		// ✅ Real-time auth listener
		// Listen to both clients for auth state changes
		const subscriptions: Array<{ subscription: { unsubscribe: () => void } }> = [];

		try {
			// Listen to persistent client
			const { data: sub1 } = supabasePersistent.auth.onAuthStateChange(
				(event, session) => {
					if (!session && !connectionError) {
						router.replace("/login");
					}
				}
			);
			subscriptions.push(sub1);

			// Listen to session client
			const { data: sub2 } = supabaseSession.auth.onAuthStateChange(
				(event, session) => {
					if (!session && !connectionError) {
						router.replace("/login");
					}
				}
			);
			subscriptions.push(sub2);
		} catch (err) {
			console.error("Error setting up auth listener:", err);
		}

		return () => {
			subscriptions.forEach((sub) => {
				if (sub) {
					sub.subscription.unsubscribe();
				}
			});
		};
	}, [checkAuth, router, connectionError]);

	// ⏳ Loading state
	if (isLoading && !connectionError) {
		return (
			<LoadingState message="جاري التحقق من الهوية..." fullScreen />
		);
	}

	// 🔴 Connection error state
	if (connectionError) {
		return (
			<div className="fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm flex items-center justify-center p-4">
				<m.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="bg-surface rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-100"
				>
					<div className="flex flex-col items-center gap-6 text-center">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
							<svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<div>
							<h2 className="text-2xl font-bold text-foreground mb-2">
								فشل الاتصال بالخادم
							</h2>
							<p className="text-muted-foreground mb-1">
								لا يمكن الاتصال بخادم Supabase
							</p>
							<p className="text-sm text-subtle">
								يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
							</p>
						</div>
						<button
							onClick={() => checkAuth()}
							className="w-full px-6 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover transition-colors"
						>
							إعادة المحاولة
						</button>
						<button
							onClick={() => router.push("/login")}
							className="text-sm text-subtle hover:text-brand transition-colors"
						>
							العودة إلى صفحة تسجيل الدخول
						</button>
					</div>
				</m.div>
			</div>
		);
	}

	// 🧱 Render dashboard if authenticated
	if (!authChecked) return null;

	return (
		<SidebarProvider>
			<div className="min-h-screen flex flex-col md:flex-row bg-background">
				<Sidebar />
				<DashboardContent>{children}</DashboardContent>
			</div>
		</SidebarProvider>
	);
}

// 🌟 Main layout wrapper

export default function DashboardLayoutWrapper({
	children,
}: DashboardLayoutWrapperProps) {
	return (
		<>
			<AuthWrapper>{children}</AuthWrapper>
			<FeedbackWidget />
		</>
	);
}
