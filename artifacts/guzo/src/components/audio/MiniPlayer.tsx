import { usePlayer } from "./PlayerContext";
import { Play, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MiniPlayer() {
  const { currentTrack, isPlaying, progress, duration, pauseTrack, resumeTrack } = usePlayer();

  if (!currentTrack) return null;

  const percent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="bg-primary/5 backdrop-blur-md border-t border-border flex flex-col sticky bottom-0 z-40 animate-in slide-in-from-bottom-2">
      {/* Progress Bar */}
      <div className="h-0.5 w-full bg-primary/10">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-linear" 
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <img 
            src={currentTrack.coverUrl || "https://placehold.co/100x100"} 
            alt={currentTrack.title}
            className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
          />
          <div className="truncate">
            <p className="text-sm font-bold text-foreground truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={isPlaying ? pauseTrack : resumeTrack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
          >
            {isPlaying ? <Pause fill="currentColor" className="h-4 w-4" /> : <Play fill="currentColor" className="h-4 w-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}
