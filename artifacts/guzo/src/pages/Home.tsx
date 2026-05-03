import {
  useGetStatsOverview,
  useListFeaturedDestinations,
  useListTrendingMezmurs,
  useListLatestNews,
  useListFeaturedItems,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { MapPin, ArrowRight, Sparkles, Music, Newspaper, ShoppingBag, Map as MapIcon, Flame, Cross, Globe, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEthiopianCalendar } from "@/providers/EthiopianCalendarProvider";
import { useSettings } from "@/providers/SettingsProvider";

export function Home() {
  const { t, i18n } = useTranslation();
  const { ethiopian, fastingKey, saint } = useEthiopianCalendar();
  const { calendar, isAmharic } = useSettings();

  const { data: stats } = useGetStatsOverview();
  const { data: featuredDestinations } = useListFeaturedDestinations();
  const { data: trendingMezmurs } = useListTrendingMezmurs();
  const { data: latestNews } = useListLatestNews();
  const { data: featuredItems } = useListFeaturedItems();

  const verses = useMemo(() => {
    const arr = i18n.t("verses", { returnObjects: true }) as Array<{ ref: string; text: string }>;
    return Array.isArray(arr) ? arr : [];
  }, [i18n.language, i18n]);

  const verse = useMemo(() => {
    if (verses.length === 0) return null;
    const dayIndex = Math.floor(Date.now() / 86400000) % verses.length;
    return verses[dayIndex];
  }, [verses]);

  const ethiopianMonthName =
    t(`calendar.months.${ethiopian.month}`, { defaultValue: ethiopian.monthName });
  const todayLabel =
    calendar === "ethiopian"
      ? `${ethiopian.day} ${ethiopianMonthName} ${ethiopian.year}`
      : new Date().toLocaleDateString(isAmharic ? "am-ET" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
  const fastLabel = t(`calendar.fastingPeriod.${fastingKey}`);

  return (
    <div className="pb-10">
      {/* Hero */}
      <section className="relative w-full aspect-[4/5] max-h-[620px] flex items-end p-6">
        <img
          src="/images/hero-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />

        <div className="relative z-10 w-full">
          <div className="inline-flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-primary-foreground/90 bg-primary/85 backdrop-blur px-3 py-1 rounded-full">
            <Cross className="h-3 w-3" />
            <span>{t("app.tagline")}</span>
          </div>
          <h1 className="text-4xl md:text-[2.6rem] font-serif font-bold text-foreground mb-3 leading-tight drop-shadow">
            {t("app.welcome")}
          </h1>
          <p className="text-muted-foreground text-base mb-6 max-w-[28ch]">
            {t("app.description")}
          </p>
          <div className="flex gap-3">
            <Link href="/destinations">
              <span
                className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 hover-elevate active-elevate-2 cursor-pointer shadow-lg"
                data-testid="link-start-journey"
              >
                {t("home.startJourney")} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/map">
              <span className="bg-background/70 backdrop-blur border border-border text-foreground px-5 py-3 rounded-full font-medium text-sm flex items-center gap-2 hover-elevate active-elevate-2 cursor-pointer">
                <MapIcon className="h-4 w-4" /> {t("nav.map")}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats card */}
      <section className="px-4 -mt-6 relative z-20">
        <div className="bg-card rounded-2xl shadow-xl border border-border/60 p-4 grid grid-cols-3 gap-2 text-center divide-x divide-border/60">
          <Stat value={stats?.destinations} label={t("home.stats.holySites")} testId="stat-destinations" />
          <Stat value={stats?.churches} label={t("home.stats.churches")} testId="stat-churches" />
          <Stat value={stats?.mezmurs} label={t("home.stats.mezmurs")} testId="stat-mezmurs" />
        </div>
      </section>

      {/* Today in Church */}
      <section className="px-4 mt-8">
        <SectionHeader
          icon={<Sparkles className="h-4 w-4" />}
          title={t("home.sections.today")}
          subtitle={t("home.sections.todaySubtitle")}
        />
        <div className="rounded-2xl bg-gradient-to-br from-primary/12 via-card to-secondary/10 border border-primary/20 p-5 shadow-sm" data-testid="card-today">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-primary font-bold mb-2">
            <span>{t("calendar.today")}</span>
            <span>{todayLabel}</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground leading-tight mb-1">
            {saint.name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {saint.description}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${fastingKey === "none"
                  ? "bg-muted text-muted-foreground"
                  : "bg-secondary/15 text-secondary"
                }`}
              data-testid="badge-fasting"
            >
              <Flame className="h-3 w-3" />
              {fastLabel}
            </span>
          </div>
        </div>
      </section>

      {/* Daily Verse */}
      {verse && (
        <section className="px-4 mt-8">
          <SectionHeader
            icon={<Cross className="h-4 w-4" />}
            title={t("home.sections.verse")}
          />
          <blockquote
            className="rounded-2xl bg-card border border-border/60 px-5 py-6 relative shadow-sm"
            data-testid="card-verse"
          >
            <span className="absolute top-1 left-3 text-6xl font-serif text-primary/15 leading-none select-none">
              “
            </span>
            <p className="font-serif text-lg leading-relaxed text-foreground italic relative">
              {verse.text}
            </p>
            <footer className="text-xs uppercase tracking-widest text-primary font-bold mt-3">
              — {verse.ref}
            </footer>
          </blockquote>
        </section>
      )}

      {/* Featured destinations */}
      <section className="mt-10 pl-4">
        <div className="flex items-end justify-between pr-4 mb-3">
          <div>
            <SectionHeader
              icon={<MapPin className="h-4 w-4" />}
              title={t("home.sections.featured")}
            />
          </div>
          <Link href="/destinations">
            <span className="text-xs font-semibold text-primary flex items-center gap-1 cursor-pointer hover-elevate px-2 py-1 rounded-md">
              {t("nav.viewAll")} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-4 -mr-4 scrollbar-hide">
          {(Array.isArray(featuredDestinations) ? featuredDestinations : []).map((dest) => (
            <Link key={dest.id} href={`/destinations/${dest.id}`}>
              <Card
                className="w-[280px] shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-95 group border-0 shadow-md"
                data-testid={`card-featured-destination-${dest.id}`}
              >
                <div className="aspect-[4/3] relative">
                  <img
                    src={dest.imageUrl || "https://placehold.co/400x300"}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 right-0">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2">
                      {dest.name}
                    </h3>
                    <div className="flex items-center text-white/90 text-xs font-medium">
                      <MapPin className="h-3 w-3 mr-1" /> {dest.region}, {dest.country}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending mezmurs */}
      <section className="mt-8 px-4">
        <div className="flex items-end justify-between mb-3">
          <SectionHeader
            icon={<Music className="h-4 w-4" />}
            title={t("home.sections.trendingMezmurs")}
          />
          <Link href="/mezmurs">
            <span className="text-xs font-semibold text-primary flex items-center gap-1 cursor-pointer hover-elevate px-2 py-1 rounded-md">
              {t("nav.viewAll")} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <div className="space-y-2">
          {(Array.isArray(trendingMezmurs) ? trendingMezmurs : []).slice(0, 4).map((m, i) => (
            <Link key={m.id} href={`/mezmurs/${m.id}`}>
              <div
                className="flex items-center gap-3 bg-card rounded-2xl p-2.5 border border-border/60 hover-elevate cursor-pointer"
                data-testid={`row-mezmur-${m.id}`}
              >
                <div className="text-xs font-mono w-5 text-center text-muted-foreground font-bold">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                  <img
                    src={m.coverUrl || "https://placehold.co/120"}
                    alt={m.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.artist}</div>
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {t("mezmurs.playCount", { count: m.plays ?? 0 })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Community Discover */}
      <section className="mt-10 px-4">
        <div className="flex items-end justify-between mb-4">
          <SectionHeader
            icon={<Users className="h-4 w-4" />}
            title={t("home.sections.community", { defaultValue: "Community Discover" })}
            subtitle={t("home.sections.communitySubtitle", { defaultValue: "Explore routes shared by fellow pilgrims." })}
          />
        </div>

        <div className="space-y-4">
          {/* Public Itineraries */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {[
              { id: "1", title: "Monasteries of Tana", author: "Abba Gabriel", stops: 7, image: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=300" },
              { id: "2", title: "Northern Cross Route", author: "Sister Selam", stops: 12, image: "https://images.unsplash.com/photo-1590050752117-23a97b02bb17?auto=format&fit=crop&q=80&w=300" },
            ].map(route => (
              <Link key={route.id} href={`/itineraries/${route.id}`}>
                <div className="w-[240px] shrink-0 bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm hover-elevate cursor-pointer group">
                  <div className="aspect-[16/9] relative">
                    <img src={route.image} alt={route.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Public Route
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-serif font-bold text-base leading-tight mb-1">{route.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>By {route.author}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {route.stops} stops</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Photos Grid (Mini) */}
          <div className="bg-secondary/5 rounded-3xl p-4 border border-secondary/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Latest Contributions
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=150",
                "https://images.unsplash.com/photo-1565451992095-26330084ba45?auto=format&fit=crop&q=80&w=150",
                "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&q=80&w=150",
                "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=150",
              ].map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer" alt="Contribution" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest news */}
      <section className="mt-8 px-4">
        <div className="flex items-end justify-between mb-3">
          <SectionHeader
            icon={<Newspaper className="h-4 w-4" />}
            title={t("home.sections.latestNews")}
          />
          <Link href="/news">
            <span className="text-xs font-semibold text-primary flex items-center gap-1 cursor-pointer hover-elevate px-2 py-1 rounded-md">
              {t("nav.viewAll")} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <div className="space-y-3">
          {(Array.isArray(latestNews) ? latestNews : []).slice(0, 3).map((post) => (
            <Link key={post.id} href={`/news/${post.id}`}>
              <article
                className="flex gap-3 bg-card rounded-2xl p-3 border border-border/60 hover-elevate cursor-pointer"
                data-testid={`row-news-${post.id}`}
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                  <img
                    src={post.coverUrl || "https://placehold.co/200"}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">
                    {post.category}
                  </div>
                  <h3 className="font-serif font-bold text-foreground leading-tight line-clamp-2 mb-1">
                    {post.title}
                  </h3>
                  <div className="text-[10px] text-muted-foreground">
                    {t("common.minRead", { count: post.readMinutes ?? 3 })}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label, testId }: { value?: number; label: string; testId?: string }) {
  return (
    <div data-testid={testId}>
      <div className="text-2xl font-bold font-serif text-primary tabular-nums">{value ?? 0}</div>
      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-[0.25em]">
        {icon}
        <span>{title}</span>
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  );
}
