import { ReactNode } from "react";
import { FloatingControls } from "./FloatingControls";
import { MiniPlayer } from "../audio/MiniPlayer";

/**
 * Chrome-less shell so the app is embeddable on web / mobile / inside an iframe.
 * No fixed top bar — page content owns the entire viewport. Floating buttons
 * (menu / lang / user / settings) sit on top of content and slide out drawers.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-[#1a1208] overflow-hidden relative">
      {/* Decorative gold ambient on desktop */}
      <div className="hidden md:block absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/10 to-background/5" />
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      {/* Phone Shell with gold-tinted bezel */}
      <div className="w-full h-[100dvh] md:h-[90vh] md:max-h-[900px] md:w-[430px] md:min-w-[400px] md:mt-[5vh] bg-background md:rounded-[36px] md:border-[8px] md:border-[#2a1f10] md:shadow-2xl overflow-hidden flex flex-col relative ring-0 md:ring-1 md:ring-primary/20">
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>

        <FloatingControls />
        <MiniPlayer />
      </div>
    </div>
  );
}
