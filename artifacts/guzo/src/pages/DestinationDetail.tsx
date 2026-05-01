import {
  useGetDestination,
  getGetDestinationQueryKey,
  useListChurches,
  getListChurchesQueryKey,
  useListDestinations,
  getListDestinationsQueryKey,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import {
  MapPin,
  Calendar,
  Info,
  ArrowLeft,
  Image as ImageIcon,
  Sun,
  Flame,
  Cross,
  Map as MapIcon,
  Share2,
  Heart,
  Church as ChurchIcon,
  Sparkles,
  Clock,
  Compass,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EngagementSection } from "@/components/engagement/EngagementSection";
import { ContributionSection } from "@/components/engagement/ContributionSection";
import { SeoHead } from "@/components/seo/SeoHead";

export function DestinationDetail() {
  const { t } = useTranslation();
  const [, params] = useRoute("/destinations/:id");
  const id = params?.id || "";
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: dest, isLoading } = useGetDestination(id, {
    query: { enabled: !!id, queryKey: getGetDestinationQueryKey(id) },
  });

  const { data: allChurches } = useListChurches(
    {},
    { query: { queryKey: getListChurchesQueryKey({}) } },
  );
  const { data: allDestinations } = useListDestinations(
    {},
    { query: { queryKey: getListDestinationsQueryKey({}) } },
  );

  const relatedChurches = useMemo(() => {
    if (!dest || !allChurches) return [];
    return (Array.isArray(allChurches) ? allChurches : [])
      .filter((c) => c.country === dest.country)
      .slice(0, 3);
  }, [dest, allChurches]);

  const relatedDestinations = useMemo(() => {
    if (!dest || !allDestinations) return [];
    return (Array.isArray(allDestinations) ? allDestinations : [])
      .filter((d) => d.id !== dest.id && (d.region === dest.region || d.country === dest.country))
      .slice(0, 4);
  }, [dest, allDestinations]);

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: dest?.name, url });
      } catch { /* dismissed */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="w-full h-72 bg-muted animate-pulse rounded-2xl" />
        <div className="h-8 bg-muted animate-pulse rounded-lg w-3/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-full" />
        <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
      </div>
    );
  }

  if (!dest)
    return <div className="p-8 text-center text-muted-foreground">Destination not found</div>;

  // Synthesize a static map preview URL via OSM
  const osmStaticUrl = `https://www.openstreetmap.org/?mlat=${dest.latitude}&mlon=${dest.longitude}#map=12/${dest.latitude}/${dest.longitude}`;

  return (
    <div className="pb-24 bg-background min-h-full">
      {/* Hero */}
      <div className="relative w-full aspect-[4/5] max-h-[600px]">
        <SeoHead
          title={dest.name}
          description={dest.shortDescription || dest.description?.slice(0, 160)}
          image={dest.imageUrl}
          type="article"
        />
        <img
          src={dest.imageUrl || "https://placehold.co/800x1000"}
          alt={dest.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-background" />

        {/* Top action bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-black/35 hover:bg-black/55 rounded-full backdrop-blur-md"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/35 hover:bg-black/55 rounded-full backdrop-blur-md"
              onClick={onShare}
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white bg-black/35 hover:bg-black/55 rounded-full backdrop-blur-md",
                saved && "text-primary bg-primary/20",
              )}
              onClick={() => setSaved((s) => !s)}
              data-testid="button-save-destination"
              aria-label="Save"
            >
              <Heart className={cn("h-5 w-5", saved && "fill-current")} />
            </Button>
          </div>
        </div>

        {/* Hero text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="inline-flex items-center gap-1 mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary-foreground bg-primary/85 backdrop-blur px-2.5 py-1 rounded-full">
            <Cross className="h-3 w-3" />
            <span>{dest.country}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white drop-shadow-lg leading-tight mb-2">
            {dest.name}
          </h1>
          <div className="flex items-center text-white/90 text-sm font-medium">
            <MapPin className="h-4 w-4 mr-1" /> {dest.region}, {dest.country}
          </div>
        </div>
      </div>

      {/* Pull-up content card */}
      <div className="px-4 -mt-6 relative z-20 space-y-5">
        {/* Quick facts grid */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/60 p-4 grid grid-cols-3 divide-x divide-border/60 text-center">
          <Fact icon={<Calendar className="h-4 w-4" />} label={t("destinations.feastDay")} value={dest.feastDay || "—"} />
          <Fact icon={<Sun className="h-4 w-4" />} label={t("destinations.bestSeason")} value={dest.bestSeason || "Year-round"} />
          <Fact icon={<Info className="h-4 w-4" />} label={t("destinations.founded")} value={dest.founded || "—"} />
        </div>

        {/* Short description hero card */}
        {dest.shortDescription && (
          <div
            className="rounded-2xl p-5 text-primary-foreground shadow-md relative overflow-hidden"
            style={{ background: "var(--gold-gradient)" }}
            data-testid="card-short-description"
          >
            <Sparkles className="absolute top-2 right-2 h-16 w-16 opacity-15" />
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-90 mb-2">
              {t("destinations.about")}
            </div>
            <p className="font-serif text-base leading-relaxed">{dest.shortDescription}</p>
          </div>
        )}

        {/* Full description */}
        <Section title={t("destinations.about")} icon={<Info className="h-4 w-4" />} testId="section-about">
          <div className="prose prose-sm dark:prose-invert prose-p:text-foreground/85 prose-p:leading-relaxed max-w-none font-serif">
            {dest.description.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Section>

        {/* Pilgrim guide */}
        <Section title={t("destinations.pilgrimGuide", { defaultValue: "Pilgrim's Guide" })} icon={<Compass className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-3">
            <GuideCard
              icon={<Sun className="h-5 w-5" />}
              title={t("destinations.bestSeason")}
              body={dest.bestSeason || "The site is open year-round; check with local clergy for current liturgical schedule."}
            />
            <GuideCard
              icon={<Calendar className="h-5 w-5" />}
              title={t("destinations.feastDay")}
              body={dest.feastDay ? `Major commemoration on ${dest.feastDay}. Pilgrims arrive in white robes for the all-night vigil.` : "No fixed pilgrimage day; daily liturgy continues at the site."}
            />
            <GuideCard
              icon={<Flame className="h-5 w-5" />}
              title={t("destinations.fastingTip", { defaultValue: "Fasting tradition" })}
              body="Many pilgrims observe the Wednesday and Friday fasts (no animal products until 3pm) before visiting. Bring a small offering of incense or beeswax candles."
            />
            <GuideCard
              icon={<Cross className="h-5 w-5" />}
              title={t("destinations.dressCode", { defaultValue: "Dress & conduct" })}
              body="Wear modest, light-colored clothing. Women cover the head with a netela. Remove shoes before entering the inner sanctuary. Photographs of the priests during liturgy are not permitted."
            />
          </div>
        </Section>

        {/* Gallery */}
        {dest.gallery && dest.gallery.length > 0 && (
          <Section title={t("destinations.gallery")} icon={<ImageIcon className="h-4 w-4" />}>
            <div className="grid grid-cols-3 gap-2">
              {dest.gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(img)}
                  className="aspect-square rounded-xl overflow-hidden bg-muted hover-elevate active-elevate-2 group"
                  data-testid={`button-gallery-${i}`}
                >
                  <img
                    src={img}
                    alt={`${dest.name} ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Map mini */}
        <Section title={t("destinations.viewOnMap")} icon={<MapIcon className="h-4 w-4" />}>
          <a
            href={osmStaticUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-border/60 bg-card p-4 hover-elevate active-elevate-2"
            data-testid="link-open-map"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{dest.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {dest.latitude.toFixed(4)}°, {dest.longitude.toFixed(4)}°
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 h-32 rounded-xl overflow-hidden bg-muted/40 relative">
              {/* Decorative gradient + marker pin (avoids tile dependency) */}
              <div
                className="absolute inset-0"
                style={{ background: "radial-gradient(circle at 50% 50%, hsl(42 70% 90%), hsl(40 35% 80%))" }}
              />
              <MapPin className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-primary drop-shadow" />
            </div>
          </a>
        </Section>

        {/* Related churches */}
        {relatedChurches.length > 0 && (
          <Section
            title={t("destinations.nearbyChurches", { defaultValue: "Churches in the same country" })}
            icon={<ChurchIcon className="h-4 w-4" />}
          >
            <div className="space-y-2">
              {relatedChurches.map((c) => (
                <Link key={c.id} href={`/churches/${c.id}`}>
                  <div
                    className="flex gap-3 bg-card border border-border/60 rounded-2xl p-2.5 hover-elevate cursor-pointer"
                    data-testid={`row-related-church-${c.id}`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={c.imageUrl || "https://placehold.co/120"}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {c.city}
                      </div>
                      {c.liturgyTimes && (
                        <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {c.liturgyTimes}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Related destinations */}
        {relatedDestinations.length > 0 && (
          <Section title={t("destinations.exploreMore", { defaultValue: "More holy sites nearby" })} icon={<MapPin className="h-4 w-4" />}>
            <div className="flex gap-3 overflow-x-auto -mr-4 pr-4 pb-2 scrollbar-hide">
              {relatedDestinations.map((d) => (
                <Link key={d.id} href={`/destinations/${d.id}`}>
                  <div
                    className="w-44 shrink-0 rounded-2xl overflow-hidden border border-border/60 bg-card hover-elevate cursor-pointer"
                    data-testid={`card-related-destination-${d.id}`}
                  >
                    <div className="aspect-[4/3] relative">
                      <img
                        src={d.imageUrl || "https://placehold.co/300"}
                        alt={d.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="font-medium text-sm leading-tight line-clamp-2">{d.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {d.region}, {d.country}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Prayer card */}
        <div
          className="rounded-2xl border border-secondary/30 p-5 mt-2"
          style={{ background: "linear-gradient(135deg, hsl(345 30% 95%), hsl(40 50% 96%))" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-secondary mb-2 flex items-center gap-1">
            <Cross className="h-3 w-3" />
            {t("destinations.prayer", { defaultValue: "Pilgrim's prayer" })}
          </div>
          <p className="font-serif text-base italic leading-relaxed text-foreground">
            "Egzio Kristos, who chose this place as a dwelling for your saints, grant me to walk
            with reverence, to listen with my heart, and to return home carrying a portion of the
            light I have received here."
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <button
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          data-testid="lightbox-overlay"
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </button>
      )}

      <ContributionSection targetType="destination" targetId={id} />
      <EngagementSection targetType="destination" targetId={id} />
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  testId,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section data-testid={testId}>
      <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-2">
      <div className="flex items-center justify-center text-primary opacity-70 mb-1">{icon}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </div>
      <div className="text-[11px] font-semibold text-foreground mt-1 line-clamp-2 leading-tight">
        {value}
      </div>
    </div>
  );
}

function GuideCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-3 shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground mb-1">{title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
