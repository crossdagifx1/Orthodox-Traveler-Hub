import { useListDestinations, getListDestinationsQueryKey } from "@workspace/api-client-react";

import { Link } from "wouter";

import { useState, useMemo } from "react";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Sparkles, Download, Check, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOffline } from "@/hooks/useOffline";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDestinationQueryKey } from "@workspace/api-client-react";



export function Destinations() {

  const { t } = useTranslation();

  const [search, setSearch] = useState("");

  const [region, setRegion] = useState<string>("all");



  const { data: destinations, isLoading } = useListDestinations(

    { q: search || undefined },

    { query: { queryKey: getListDestinationsQueryKey({ q: search || undefined }) } },

  );



  const regions = useMemo(() => {

    const set = new Set<string>();

    (destinations ?? []).forEach((d) => d.region && set.add(d.region));

    return Array.from(set);

  }, [destinations]);



  const filtered = useMemo(() => {

    if (region === "all") return destinations ?? [];

    return (destinations ?? []).filter((d) => d.region === region);

  }, [destinations, region]);



  const featured = filtered.filter((d) => d.isFeatured);

  const others = filtered.filter((d) => !d.isFeatured);



  const isOffline = useOffline();
  const qc = useQueryClient();
  const [cachingRegion, setCachingRegion] = useState<string | null>(null);

  const handleCacheRegion = async () => {
    if (region === "all") return;
    setCachingRegion(region);
    
    // Simulate pre-fetching all destinations in this region
    const targets = filtered.map(d => d.id);
    for (const tid of targets) {
      // In a real app, we'd trigger a query fetch here
      // qc.prefetchQuery({ queryKey: getGetDestinationQueryKey(tid) })
      await new Promise(r => setTimeout(r, 100));
    }
    
    setCachingRegion(null);
  };

  return (

    <div className="pb-20">

      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40 flex flex-col items-center text-center">
        <h1 className="text-2xl font-serif font-bold text-primary mb-0.5">{t("destinations.title")}</h1>
        <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-widest">{t("destinations.subtitle")}</p>
          {region !== "all" && !isOffline && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full h-8 text-[10px] font-bold uppercase tracking-wider"
              onClick={handleCacheRegion}
              disabled={!!cachingRegion}
            >
              {cachingRegion ? (
                <><div className="h-3 w-3 border-2 border-primary border-t-transparent animate-spin rounded-full mr-2" /> Saving...</>
              ) : (
                <><Download className="h-3.5 w-3.5 mr-1.5" /> Cache Region</>
              )}
            </Button>
          )}

        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input

            placeholder={t("destinations.searchPlaceholder")}

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            className="pl-9 bg-card border-border/60 rounded-full"

            data-testid="input-search-destinations"

          />

        </div>

        {regions.length > 0 && (

          <div className="flex gap-2 overflow-x-auto pb-1 mt-3 scrollbar-hide -mx-1 px-1">

            <Chip

              active={region === "all"}

              onClick={() => setRegion("all")}

              testId="chip-region-all"

            >

              {t("destinations.regionAll")}

            </Chip>

            {regions.map((r) => (

              <Chip

                key={r}

                active={region === r}

                onClick={() => setRegion(r)}

                testId={`chip-region-${r}`}

              >

                {r}

              </Chip>

            ))}

          </div>

        )}

      </header>



      <div className="p-4">

        {isLoading ? (

          <div className="space-y-4">

            {[1, 2, 3].map((i) => (

              <div key={i} className="w-full h-48 bg-muted animate-pulse rounded-2xl" />

            ))}

          </div>

        ) : filtered.length === 0 ? (

          <div className="text-center py-20">

            <img

              src="/images/empty-scroll.png"

              alt=""

              className="w-32 h-32 mx-auto opacity-50 mb-4 rounded-xl mix-blend-multiply"

            />

            <p className="text-muted-foreground font-serif text-lg">

              {t("destinations.noDestinations")}

            </p>

          </div>

        ) : (

          <>

            {featured.length > 0 && (

              <div className="mb-8">

                <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-3">

                  <Sparkles className="h-3 w-3" />

                  {t("common.featured")}

                </div>

                <Link href={`/destinations/${featured[0].id}`}>

                  <Card

                    className="overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-[0.98] border-0 shadow-md rounded-3xl group relative"

                    data-testid={`card-destination-featured-${featured[0].id}`}

                  >

                    <div className="aspect-[5/4] relative">

                      <img

                        src={featured[0].imageUrl || "https://placehold.co/600x500"}

                        alt={featured[0].name}

                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"

                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      <div className="absolute top-4 left-4 inline-flex items-center gap-1 bg-primary/85 backdrop-blur text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">

                        <Sparkles className="h-3 w-3" /> {t("common.featured")}

                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">

                        <h2 className="font-serif font-bold text-2xl leading-tight mb-1">

                          {featured[0].name}

                        </h2>

                        <div className="text-sm opacity-90 flex items-center gap-1">

                          <MapPin className="h-3 w-3" />

                          {featured[0].region}, {featured[0].country}

                        </div>

                        {featured[0].description && (

                          <p className="text-xs opacity-80 mt-2 line-clamp-2">

                            {featured[0].description}

                          </p>

                        )}

                      </div>

                    </div>

                  </Card>

                </Link>

              </div>

            )}



            <div className="grid gap-5">

              {[...featured.slice(1), ...others].map((dest) => (

                <Link key={dest.id} href={`/destinations/${dest.id}`}>

                  <Card

                    className="overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-[0.98] border border-border/60 shadow-sm rounded-2xl group"

                    data-testid={`card-destination-${dest.id}`}

                  >

                    <div className="aspect-video relative">

                      <img

                        src={dest.imageUrl || "https://placehold.co/600x400"}

                        alt={dest.name}

                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"

                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />

                      <div className="absolute bottom-0 left-0 p-4 text-white">

                        <h3 className="font-serif font-bold text-xl leading-tight">

                          {dest.name}

                        </h3>

                        <div className="text-xs opacity-90 flex items-center gap-1 mt-1">

                          <MapPin className="h-3 w-3" />

                          {dest.region}, {dest.country}

                        </div>

                      </div>

                    </div>

                    <div className="p-4">

                      {dest.description && (

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">

                          {dest.description}

                        </p>

                      )}

                      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">

                        {dest.feastDay && (

                          <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">

                            <Calendar className="h-3 w-3" /> {dest.feastDay}

                          </span>

                        )}

                        {dest.bestSeason && (

                          <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">

                            {dest.bestSeason}

                          </span>

                        )}

                      </div>

                    </div>

                  </Card>

                </Link>

              ))}

            </div>

          </>

        )}

      </div>

    </div>

  );

}



function Chip({

  active,

  onClick,

  children,

  testId,

}: {

  active: boolean;

  onClick: () => void;

  children: React.ReactNode;

  testId?: string;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      data-testid={testId}

      className={cn(

        "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors hover-elevate active-elevate-2",

        active

          ? "bg-primary text-primary-foreground shadow-sm"

          : "bg-card border border-border/60 text-muted-foreground",

      )}

    >

      {children}

    </button>

  );

}

