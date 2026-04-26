import { usePlayer } from "./PlayerContext";
import { Play, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MiniPlayer() {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="bg-primary/5 backdrop-blur-md border-t border-border p-2 flex items-center justify-between sticky bottom-0 z-40 animate-in slide-in-from-bottom-2">
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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          {isPlaying ? <Pause fill="currentColor" className="h-4 w-4" /> : <Play fill="currentColor" className="h-4 w-4 ml-1" />}
        </button>
      </div>
    </div>
  );
}
