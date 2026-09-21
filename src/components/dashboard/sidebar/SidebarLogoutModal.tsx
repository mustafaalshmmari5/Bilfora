"use client";

import { LogOut } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { surface, interactive, colors } from "@/lib/ui/tokens";

interface SidebarLogoutModalProps {
    isOpen: boolean;
    isLoggingOut: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function SidebarLogoutModal({
    isOpen,
    isLoggingOut,
    onClose,
    onConfirm,
}: SidebarLogoutModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-overlay backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={`relative bg-surface w-full max-w-sm ${surface.radius.large} ${surface.shadow.xxlarge} p-8 overflow-hidden`}
                    >
                        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-red-500 to-orange-500" />

                        <div className={`w-16 h-16 ${colors.status.error.bg} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                            <LogOut className={`${colors.status.error.text} w-8 h-8 ml-1`} />
                        </div>

                        <h3 className="text-xl font-bold text-foreground text-center mb-2">
                            هل تود المغادرة؟
                        </h3>
                        <p className="text-subtle text-center mb-8 leading-relaxed">
                            سيتم تسجيل خروجك من حسابك في مستحقات الشركات، يمكنك دائماً العودة لاحقاً.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className={`flex-1 ${interactive.button.size.md} ${interactive.button.radius.default} ${surface.border.standard} text-muted-foreground font-medium hover:bg-surface-2 hover:border-border-strong transition-all`}
                            >
                                البقاء
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoggingOut}
                                className={`flex-1 ${interactive.button.size.md} ${interactive.button.radius.default} bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {isLoggingOut ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>جاري الخروج...</span>
                                    </div>
                                ) : (
                                    "تسجيل الخروج"
                                )}
                            </button>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}
