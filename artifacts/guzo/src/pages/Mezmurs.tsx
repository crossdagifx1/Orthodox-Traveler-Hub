import { useListMezmurs, getListMezmursQueryKey, useIncrementMezmurPlays } from "@workspace/api-client-react";
import { useState } from "react";
import { Search, Play, Disc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { usePlayer } from "@/components/audio/PlayerContext";
import { Link } from "wouter";

const CATEGORIES = ["All", "Fast", "Feast", "Saint Mary", "Angels", "Repentance"];

export function Mezmurs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { data: mezmurs, isLoading } = useListMezmurs(
    { q: search || undefined, category: category === "All" ? undefined : category },
    { query: { queryKey: getListMezmursQueryKey({ q: search || undefined, category: category === "All" ? undefined : category }) } }
  );

  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const incrementPlays = useIncrementMezmurPlays();

  const handlePlay = (mezmur: any) => {
    playTrack(mezmur);
    incrementPlays.mutate({ id: mezmur.id });
  };

  return (
    <div className="p-4 pb-24">
      <div className="mb-6 sticky top-0 bg-background/95 backdrop-blur z-10 py-2 -mx-4 px-4 border-b border-border/50">
        <h1 className="text-2xl font-serif font-bold text-primary mb-4 flex items-center gap-2">
          <Disc className="h-6 w-6" /> Mezmurs
        </h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search hymns..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50 rounded-full"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)
        ) : mezmurs?.map((mezmur) => {
          const isCurrent = currentTrack?.id === mezmur.id;
          return (
            <Card key={mezmur.id} className={`p-3 flex items-center gap-4 rounded-2xl border-0 shadow-sm ${isCurrent ? 'bg-primary/5 border border-primary/20' : 'bg-card'}`}>
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 group">
                <img src={mezmur.coverUrl || "https://placehold.co/100x100"} alt={mezmur.title} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handlePlay(mezmur)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play fill="white" className="h-6 w-6 text-white ml-1" />
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <Link href={`/mezmurs/${mezmur.id}`}>
                  <h3 className="font-bold text-foreground truncate hover:text-primary transition-colors cursor-pointer">{mezmur.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground truncate">{mezmur.artist}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-medium">
                  <span className="bg-muted px-2 py-0.5 rounded-md uppercase tracking-wider">{mezmur.category}</span>
                  <span>{Math.floor(mezmur.duration / 60)}:{(mezmur.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handlePlay(mezmur)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                  isCurrent && isPlaying 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background border-border hover:bg-muted text-foreground"
                }`}
              >
                <Play fill="currentColor" className="h-4 w-4 ml-0.5" />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
