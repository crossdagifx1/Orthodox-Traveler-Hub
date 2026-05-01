import { ReactNode } from "react";
import { FloatingControls } from "./FloatingControls";
import { AdminToolbar } from "./AdminToolbar";
import { MiniPlayer } from "../audio/MiniPlayer";
import { useSettings } from "@/providers/SettingsProvider";
import { useOffline } from "@/hooks/useOffline";
import { cn } from "@/lib/utils";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

/**
 * Chrome-less shell so the app is embeddable on web / mobile / inside an iframe.
 * No fixed top bar — page content owns the entire viewport. Floating buttons
 * (menu / lang / user / settings) sit on top of content and slide out drawers.
 *
 * Two view modes (driven by SettingsProvider):
 *  - "phone": fixed-width 430px phone bezel, centred on a dark backdrop.
 *  - "desktop": full-bleed, content fills the viewport with a comfortable
 *               max-width for readability.
 * "auto" resolves to desktop on >=1024px viewports, phone otherwise.
 */
export function Shell({ children }: { children: ReactNode }) {
  const { effectiveView } = useSettings();
  const isOffline = useOffline();
  const { t } = useTranslation();
  const isDesktop = effectiveView === "desktop";

  return (
    <div
      className={cn(
        "min-h-[100dvh] w-full flex justify-center overflow-hidden relative",
        isDesktop ? "bg-background" : "bg-[#1a1208]",
      )}
      data-view={effectiveView}
    >
      {/* Decorative gold ambient — only behind the phone bezel. */}
      {!isDesktop && (
        <div className="hidden md:block absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/10 to-background/5" />
          <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-secondary/10 rounded-full blur-[120px]" />
        </div>
      )}

      <div
        className={cn(
          "bg-background overflow-hidden flex flex-col relative",
          isDesktop
            ? "w-full min-h-[100dvh]"
            : "w-full h-[100dvh] md:h-[90vh] md:max-h-[900px] md:w-[430px] md:min-w-[400px] md:mt-[5vh] md:rounded-[36px] md:border-[8px] md:border-[#2a1f10] md:shadow-2xl ring-0 md:ring-1 md:ring-primary/20",
        )}
      >
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-secondary/10 border-b border-secondary/20 overflow-hidden"
            >
              <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
                <WifiOff className="h-3 w-3" />
                <span>{t("common.offlineMode", { defaultValue: "Offline Mode — Limited Functionality" })}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden relative",
            isDesktop && "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8",
          )}
        >
          {children}
        </main>

        {isDesktop && <FloatingControls />}
        <MiniPlayer />
        <AdminToolbar />
      </div>
    </div>
  );
}
