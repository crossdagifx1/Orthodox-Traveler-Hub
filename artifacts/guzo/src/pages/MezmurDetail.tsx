import {
  useGetMezmur,
  getGetMezmurQueryKey,
  useIncrementMezmurPlays,
  useListTrendingMezmurs,
  useListMezmurs,
  getListMezmursQueryKey,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Play,
  Pause,
  Repeat,
  Share2,
  Heart,
  Music,
  User as Artist,
  Clock,
  Calendar,
  Languages,
  ListMusic,
  Download,
  Check,
  CloudOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/audio/PlayerContext";
import { EngagementSection } from "@/components/engagement/EngagementSection";
import { SeoHead } from "@/components/seo/SeoHead";
import { cn } from "@/lib/utils";

export function MezmurDetail() {
  const { t } = useTranslation();
  const [, params] = useRoute("/mezmurs/:id");
  const id = params?.id || "";

  const { data: mezmur, isLoading } = useGetMezmur(id, {
    query: { enabled: !!id, queryKey: getGetMezmurQueryKey(id) },
  });

  const { data: allMezmurs } = useListMezmurs(
    {},
    { query: { queryKey: getListMezmursQueryKey({}) } },
  );
  const { data: trending } = useListTrendingMezmurs();

  const related = useMemo(() => {
    if (!mezmur || !allMezmurs) return [];
    return (Array.isArray(allMezmurs) ? allMezmurs : [])
      .filter((m) => m.id !== mezmur.id && m.category === mezmur.category)
      .slice(0, 5);
  }, [mezmur, allMezmurs]);

  const trendingNow = useMemo(() => {
    return (Array.isArray(trending) ? trending : []).filter((m) => m.id !== mezmur?.id).slice(0, 5);
  }, [trending, mezmur]);

  const { 
    playTrack, 
    pauseTrack, 
    resumeTrack, 
    currentTrack, 
    isPlaying, 
    progress, 
    duration, 
    seek 
  } = usePlayer();
  const incrementPlays = useIncrementMezmurPlays();

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (mezmur) {
      checkDownloadStatus();
    }
  }, [mezmur]);

  const checkDownloadStatus = async () => {
    if (!mezmur) return;
    try {
      const cache = await caches.open("mezmur-audio");
      const match = await cache.match(mezmur.audioUrl);
      setIsDownloaded(!!match);
    } catch (e) {
      console.error("Cache check failed", e);
    }
  };

  const handleDownload = async () => {
    if (!mezmur) return;
    setIsDownloading(true);
    try {
      const cache = await caches.open("mezmur-audio");
      await cache.add(mezmur.audioUrl);
      setIsDownloaded(true);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

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

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: mezmur?.title, url }); } catch { /* */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* */ }
    }
  };

  if (isLoading)
    return (
      <div className="p-8 flex justify-center">
        <div className="w-64 h-64 bg-muted animate-pulse rounded-3xl" />
      </div>
    );
  if (!mezmur) return <div className="p-8 text-center">Mezmur not found</div>;

  const mins = Math.floor(mezmur.duration / 60);
  const secs = (mezmur.duration % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-full bg-background pb-32">
      <SeoHead
        title={`${mezmur.title} — ${mezmur.artist}`}
        description={mezmur.lyrics?.slice(0, 160) || `${mezmur.category} mezmur in ${mezmur.language}.`}
        image={mezmur.coverUrl}
        type="music.song"
      />
      {/* Top bar */}
      <div className="px-3 py-3 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => window.history.back()}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
            {t("mezmurs.playing")}
          </span>
          {isDownloaded && (
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mt-0.5">
              <Check className="h-2 w-2" /> Offline
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full", isDownloaded && "text-primary")}
            onClick={handleDownload}
            disabled={isDownloading || isDownloaded}
            data-testid="button-download"
          >
            {isDownloading ? (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            ) : isDownloaded ? (
              <Check className="h-5 w-5" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onShare}
            data-testid="button-share"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Cover */}
      <div className="px-8 pt-2 flex flex-col items-center">
        <div
          className={`relative w-full max-w-[260px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-card transition-all duration-700 ${
            isCurrent && isPlaying ? "scale-105 shadow-primary/30" : "scale-100"
          }`}
        >
          <img
            src={mezmur.coverUrl || "https://placehold.co/400x400"}
            alt={mezmur.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 mix-blend-overlay opacity-30"
            style={{ background: "var(--gold-gradient)" }}
          />
        </div>

        {/* Title */}
        <div className="text-center mt-6 mb-4 w-full">
          <h1
            className="text-2xl font-serif font-bold text-foreground mb-1 px-4"
            data-testid="text-mezmur-title"
          >
            {mezmur.title}
          </h1>
          <p className="text-muted-foreground text-base">{mezmur.artist}</p>
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            <Chip icon={<Music className="h-3 w-3" />} label={mezmur.category} />
            <Chip icon={<Languages className="h-3 w-3" />} label={mezmur.language} />
            <Chip
              icon={<Clock className="h-3 w-3" />}
              label={`${mins}:${secs}`}
            />
          </div>
        </div>

        {/* Progress */}
        <div className="w-full mb-6 px-2">
          <div 
            className="h-1.5 w-full bg-muted rounded-full overflow-hidden cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = x / rect.width;
              seek(pct * duration);
            }}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-linear"
              style={{ width: `${(progress / (duration || 1)) * 100}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${(progress / (duration || 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium tabular-nums">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            data-testid="button-repeat"
          >
            <Repeat className="h-5 w-5" />
          </Button>
          <button
            onClick={handlePlayToggle}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all text-primary-foreground"
            style={{ background: "var(--gold-gradient)" }}
            data-testid="button-play"
          >
            {isCurrent && isPlaying ? (
              <Pause fill="currentColor" className="h-8 w-8" />
            ) : (
              <Play fill="currentColor" className="h-8 w-8 ml-1" />
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            data-testid="button-favorite"
          >
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Stats strip */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 grid grid-cols-3 divide-x divide-border/60 text-center shadow-sm">
          <Stat label={t("mezmurs.duration")} value={`${mins}:${secs}`} />
          <Stat
            label={t("mezmurs.plays", { defaultValue: "Plays" })}
            value={(mezmur.plays ?? 0).toLocaleString()}
          />
          <Stat label={t("mezmurs.language")} value={mezmur.language} />
        </div>

        {/* Lyrics */}
        <Section title={t("mezmurs.lyrics")}>
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
            {mezmur.lyrics ? (
              <pre className="font-serif text-base leading-loose text-foreground whitespace-pre-wrap text-center">
                {mezmur.lyrics}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground text-center">{t("mezmurs.noLyrics")}</p>
            )}
          </div>
        </Section>

        {/* Artist card */}
        <Section
          title={t("mezmurs.aboutArtist", { defaultValue: "About the artist" })}
        >
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Artist className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-foreground truncate">{mezmur.artist}</div>
              <div className="text-xs text-muted-foreground">
                {t("mezmurs.tradition", {
                  defaultValue: "Ethiopian Orthodox Tewahedo Mezmur tradition",
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* Occasion */}
        <Section title={t("mezmurs.occasion", { defaultValue: "Occasion" })}>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-3 shadow-sm">
            <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-foreground/85 leading-relaxed">
              {categoryBlurb(mezmur.category)}
            </div>
          </div>
        </Section>

        {/* Related */}
        {related.length > 0 && (
          <Section
            title={t("mezmurs.relatedInCategory", {
              defaultValue: "More in this tradition",
            })}
          >
            <div className="space-y-2">
              {related.map((m) => (
                <Link key={m.id} href={`/mezmurs/${m.id}`}>
                  <div
                    className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl p-2.5 hover-elevate cursor-pointer"
                    data-testid={`row-related-mezmur-${m.id}`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={m.coverUrl || "https://placehold.co/120"}
                        alt={m.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {m.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{m.artist}</div>
                    </div>
                    <Play className="h-4 w-4 text-primary shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Trending now */}
        {trendingNow.length > 0 && (
          <Section title={t("home.sections.trendingMezmurs")}>
            <div className="flex gap-3 overflow-x-auto -mr-5 pr-5 pb-2 scrollbar-hide">
              {trendingNow.map((m) => (
                <Link key={m.id} href={`/mezmurs/${m.id}`}>
                  <div className="w-32 shrink-0 hover-elevate cursor-pointer">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-sm">
                      <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs font-medium text-foreground line-clamp-1 mt-2">
                      {m.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">
                      {m.artist}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 pt-4 flex items-center justify-center gap-2">
          <ListMusic className="h-3 w-3" />
          {t("mezmurs.subtitle")}
        </div>
      </div>

      <EngagementSection targetType="mezmur" targetId={id} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary mb-3 px-1">
        {title}
      </div>
      {children}
    </section>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider">
      {icon}
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <div className="text-base font-bold font-serif text-primary tabular-nums leading-tight">
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
        {label}
      </div>
    </div>
  );
}

function categoryBlurb(category: string): string {
  switch (category) {
    case "Marian":
      return "A hymn in honor of the Theotokos, the Holy Virgin Mary, who is venerated in the Tewahedo Church under titles such as Mother of Light, Tabernacle of the Word, and Queen of Heaven.";
    case "Christmas":
      return "Sung from the Advent fast (Tsome Nebiyat) through the great feast of Genna on Tahsas 29, celebrating the Incarnation of our Lord in Bethlehem.";
    case "Epiphany":
      return "Belongs to Timkat, the Tewahedo feast of the baptism of Christ in the Jordan, celebrated on Terr 11 with white-clad pilgrimages and the consecration of waters.";
    case "Easter":
    case "Fasika":
      return "Sung throughout the Great Lent (Hudadi) and Bright Week, proclaiming Christ's victory over death — Krestos tenshe'a! Be'ametseh Mot!";
    case "Lent":
      return "A Lenten hymn (Tsome Arba) — sung during the great 55-day fast that prepares the Tewahedo faithful for Easter.";
    case "Cross":
      return "A hymn of the Holy Cross — chanted especially during Mesqel, the September festival commemorating Empress Helena's discovery of the True Cross.";
    case "Saints":
      return "A hymn for the saints — recalling their lives, miracles, and intercession on behalf of the Church.";
    case "Hosanna":
      return "Sung on Hosa'ena (Palm Sunday), as the faithful re-enact Christ's entry into Jerusalem with palm leaves and olive branches.";
    case "Mesqel":
      return "Sung during the Mesqel feast — the September commemoration of the discovery of the True Cross by Empress Helena, mother of Emperor Constantine.";
    case "Praise":
      return "A hymn of praise to the Holy Trinity — central to the Tewahedo daily office and the Sunday Qedase.";
    case "Liturgical":
      return "A hymn used in the formal Tewahedo Liturgy of the Hours — composed in the modes of Saint Yared (Ge'ez, Ezel, Ararai).";
    default:
      return "Part of the rich tradition of sacred song that has shaped Ethiopian Orthodox worship for over fifteen centuries.";
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
