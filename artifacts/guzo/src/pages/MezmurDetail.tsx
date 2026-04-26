import { useGetMezmur, getGetMezmurQueryKey, useIncrementMezmurPlays } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { ArrowLeft, Play, Pause, Repeat, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/audio/PlayerContext";
import { useEffect } from "react";

export function MezmurDetail() {
  const [, params] = useRoute("/mezmurs/:id");
  const id = params?.id || "";

  const { data: mezmur, isLoading } = useGetMezmur(id, {
    query: { enabled: !!id, queryKey: getGetMezmurQueryKey(id) }
  });

  const { playTrack, pauseTrack, resumeTrack, currentTrack, isPlaying } = usePlayer();
  const incrementPlays = useIncrementMezmurPlays();

  const isCurrent = currentTrack?.id === id;

  const handlePlayToggle = () => {
    if (!mezmur) return;
    if (isCurrent && isPlaying) {
      pauseTrack();
    } else if (isCurrent && !isPlaying) {
      resumeTrack();
    } else {
      playTrack(mezmur);
      incrementPlays.mutate({ id: mezmur.id });
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-64 h-64 bg-muted animate-pulse rounded-full" /></div>;
  if (!mezmur) return <div className="p-8 text-center">Mezmur not found</div>;

  return (
    <div className="min-h-full bg-background flex flex-col pt-4">
      <div className="px-4 mb-8 flex justify-between items-center">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Now Playing</span>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 px-8 flex flex-col items-center">
        <div className={`w-full max-w-[280px] aspect-square rounded-3xl overflow-hidden shadow-2xl mb-8 border-4 border-card transition-all duration-700 ${isCurrent && isPlaying ? 'scale-105 shadow-primary/20' : 'scale-100'}`}>
          <img src={mezmur.coverUrl || "https://placehold.co/400x400"} alt={mezmur.title} className="w-full h-full object-cover" />
        </div>

        <div className="text-center mb-8 w-full">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2 truncate px-4">{mezmur.title}</h1>
          <p className="text-muted-foreground text-lg">{mezmur.artist}</p>
        </div>

        {/* Progress bar mock */}
        <div className="w-full mb-8 px-4">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/3 rounded-full" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
            <span>1:24</span>
            <span>{Math.floor(mezmur.duration / 60)}:{(mezmur.duration % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Repeat className="h-5 w-5" />
          </Button>
          <button 
            onClick={handlePlayToggle}
            className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {isCurrent && isPlaying ? (
              <Pause fill="currentColor" className="h-8 w-8" />
            ) : (
              <Play fill="currentColor" className="h-8 w-8 ml-2" />
            )}
          </button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </Button>
        </div>

        {mezmur.lyrics && (
          <div className="w-full mt-auto bg-card rounded-t-3xl p-6 shadow-lg border border-border/50 pb-24">
            <h3 className="font-serif font-bold text-center mb-4 text-muted-foreground uppercase tracking-widest text-xs">Lyrics</h3>
            <p className="text-center font-serif text-lg leading-relaxed text-foreground whitespace-pre-wrap opacity-80">
              {mezmur.lyrics}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
