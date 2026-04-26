import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { MiniPlayer } from "../audio/MiniPlayer";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-[#1a0f12] overflow-hidden relative">
      {/* Decorative ambient background on desktop */}
      <div className="hidden md:block absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* Phone Shell */}
      <div className="w-full h-[100dvh] md:h-[90vh] md:max-h-[900px] md:w-[430px] md:min-w-[400px] md:mt-[5vh] bg-background md:rounded-[36px] md:border-[8px] md:border-[#2a1f22] md:shadow-2xl overflow-hidden flex flex-col relative">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>

        <MiniPlayer />
        <BottomNav />
      </div>
    </div>
  );
}
