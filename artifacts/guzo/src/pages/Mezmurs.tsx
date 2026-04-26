import {
  useListMezmurs,
  getListMezmursQueryKey,
  useListTrendingMezmurs,
  useIncrementMezmurPlays,
} from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Play, Disc, Sparkles, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlayer } from "@/components/audio/PlayerContext";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const CATEGORIES = ["all", "Praise", "Marian", "Apostolic", "Christmas", "Easter", "Lent", "Saints"] as const;
type SortKey = "trending" | "newest" | "az";

export function Mezmurs() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("trending");

  const { data: mezmurs, isLoading } = useListMezmurs(
    {
      q: search || undefined,
      category: category === "all" ? undefined : category,
    },
    {
      query: {
        queryKey: getListMezmursQueryKey({
          q: search || undefined,
          category: category === "all" ? undefined : category,
        }),
      },
    },
  );
  const { data: trending } = useListTrendingMezmurs();

  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const incrementPlays = useIncrementMezmurPlays();

  const handlePlay = (m: any) => {
    if (currentTrack?.id === m.id) {
      togglePlayPause();
      return;
    }
    playTrack(m);
    incrementPlays.mutate({ id: m.id });
  };

  const sorted = useMemo(() => {
    const arr = [...(mezmurs ?? [])];
    switch (sort) {
      case "newest":
        arr.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        break;
      case "az":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "trending":
      default:
        arr.sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
    }
    return arr;
  }, [mezmurs, sort]);

  return (
    <div className="pb-32 bg-background min-h-full">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <Disc className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-serif font-bold text-primary">{t("mezmurs.title")}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{t("mezmurs.subtitle")}</p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("mezmurs.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60 rounded-full"
            data-testid="input-search-mezmurs"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              data-testid={`chip-mezmur-${cat}`}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors hover-elevate active-elevate-2",
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/60 text-muted-foreground",
              )}
            >
              {cat === "all"
                ? t("mezmurs.categories.all")
                : t(`mezmurs.categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>
      </header>

      {category === "all" && (trending?.length ?? 0) > 0 && (
        <section className="pl-4 mt-4">
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-2">
            <Sparkles className="h-3 w-3" />
            {t("common.trending")}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 pr-4 -mr-4 scrollbar-hide">
            {(trending ?? []).slice(0, 8).map((m) => (
              <button
                key={m.id}
                onClick={() => handlePlay(m)}
                data-testid={`card-trending-${m.id}`}
                className="w-[150px] shrink-0 text-left rounded-2xl overflow-hidden hover-elevate active-elevate-2 group cursor-pointer"
              >
                <div className="aspect-square bg-muted/60 overflow-hidden relative rounded-2xl">
                  <img
                    src={m.coverUrl || "https://placehold.co/300"}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-5 w-5 ml-0.5 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="px-1 pt-2">
                  <div className="text-sm font-medium text-foreground truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.artist}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground tabular-nums">{sorted.length}</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger
              className="h-8 w-[160px] rounded-full text-xs border-border/60 bg-card"
              data-testid="select-mezmur-sort"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">{t("common.trending")}</SelectItem>
              <SelectItem value="newest">{t("common.new")}</SelectItem>
              <SelectItem value="az">A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Disc className="h-10 w-10 mx-auto opacity-30 mb-3" />
            <p className="font-serif">{t("mezmurs.noMezmurs")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((m) => {
              const isCurrent = currentTrack?.id === m.id;
              const showPause = isCurrent && isPlaying;
              return (
                <Card
                  key={m.id}
                  className="border border-border/60 rounded-2xl overflow-hidden hover-elevate"
                  data-testid={`row-mezmur-${m.id}`}
                >
                  <div className="flex items-center gap-3 p-2">
                    <button
                      onClick={() => handlePlay(m)}
                      aria-label={showPause ? "Pause" : "Play"}
                      data-testid={`button-play-${m.id}`}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 hover-elevate active-elevate-2 relative overflow-hidden",
                        isCurrent ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {m.coverUrl && !isCurrent && (
                        <img
                          src={m.coverUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
                      )}
                      <span className="relative z-10">
                        {showPause ? (
                          <Pause className="h-5 w-5 fill-current" />
                        ) : (
                          <Play className="h-5 w-5 ml-0.5 fill-current text-foreground/90" />
                        )}
                      </span>
                    </button>
                    <Link href={`/mezmurs/${m.id}`} className="flex-1 min-w-0">
                      <div className="cursor-pointer">
                        <div className="font-medium text-foreground text-sm truncate">
                          {m.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {m.artist} · {m.category}
                        </div>
                      </div>
                    </Link>
                    <div className="text-[10px] text-muted-foreground tabular-nums shrink-0 pr-2">
                      {t("mezmurs.playCount", { count: m.plays ?? 0 })}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
