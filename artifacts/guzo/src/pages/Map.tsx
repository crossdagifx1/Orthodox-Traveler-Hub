import { useMemo, useState } from "react";
import { useListChurches, getListChurchesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Search,
  MapPin,
  List,
  Map as MapIcon,
  Globe2,
  Clock,
  User,
  ChevronRight,
  CloudDownload,
  Loader2,
  Layers,
  Zap,
  Camera,
  Sparkles,
  Navigation2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AdvancedMap, type AdvancedMapMarker } from "@/components/map/AdvancedMap";
import { GoogleMapView } from "@/components/map/GoogleMapView";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export function Map() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"map" | "list">("map");
  const [country, setCountry] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [showSocial, setShowSocial] = useState(true);
  const [isCompassOpen, setIsCompassOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadingRegion, setDownloadingRegion] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const { data: churches } = useListChurches(
    {},
    { query: { queryKey: getListChurchesQueryKey({}) } },
  );

  /**
   * Admin action: sweep Google Places for Ethiopian Orthodox churches across
   * the major cities and bulk-insert any new ones into the `churches` table.
   * Backed by `POST /api/churches/sync-google-places`.
   */
  const handleSyncGooglePlaces = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/churches/sync-google-places", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Sync failed");
      toast({
        title: "Churches synced",
        description: `Added ${data.inserted ?? 0} new churches (${data.duplicates ?? 0} duplicates skipped of ${data.seen ?? 0} found).`,
      });
      await queryClient.invalidateQueries({ queryKey: getListChurchesQueryKey({}) });
    } catch (err: any) {
      toast({
        title: "Sync failed",
        description: err?.message ?? "Could not reach Google Places API.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const countries = useMemo(() => {
    const set = new Set<string>();
    (Array.isArray(churches) ? churches : []).forEach((c) => c.country && set.add(c.country));
    return Array.from(set).sort();
  }, [churches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (Array.isArray(churches) ? churches : []).filter((c) => {
      if (country !== "all" && c.country !== country) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
      );
    });
  }, [churches, country, search]);

  const markers: AdvancedMapMarker[] = useMemo(
    () =>
      filtered.map((c) => ({
        id: c.id,
        lat: c.latitude,
        lng: c.longitude,
        title: c.name,
        subtitle: `${c.city}, ${c.country}`,
        imageUrl: c.imageUrl,
        detailsHref: `${import.meta.env.BASE_URL || "/"}churches/${c.id}`.replace(/\/+/g, "/"),
        badge: c.country,
        meta: [
          c.priest ? { label: `✟ ${c.priest}` } : null,
          c.liturgyTimes ? { label: `🕓 ${c.liturgyTimes}` } : null,
        ].filter(Boolean) as Array<{ label: string }>,
      })),
    [filtered],
  );

  return (
    <div className="flex flex-col h-full bg-background pt-14">
      {/* Top filter bar — sits below the floating menu/lang controls */}
      <div className="px-3 pb-3 space-y-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" /> {t("map.title")}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {filtered.length} {t("map.churches", { defaultValue: "churches" })} ·{" "}
              {countries.length} {t("map.countries", { defaultValue: "countries" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={handleSyncGooglePlaces}
                disabled={syncing}
                data-testid="button-sync-google-places"
                title="Sync Ethiopian Orthodox churches from Google Places"
                className="h-8 px-3 rounded-full text-[11px] font-semibold flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {syncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CloudDownload className="h-3.5 w-3.5" />
                )}
                {syncing ? "Syncing…" : "Sync from Google"}
              </button>
            )}
            <div className="flex bg-card rounded-full p-0.5 border border-border/60">
              <button
                type="button"
                onClick={() => setView("map")}
                data-testid="button-view-map"
                aria-label="Map view"
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs",
                  view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                data-testid="button-view-list"
                aria-label="List view"
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs",
                  view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("map.searchPlaceholder", { defaultValue: "Search churches…" })}
              className="pl-9 rounded-full h-9 text-sm"
              data-testid="input-map-search-list"
            />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[120px] h-9 rounded-full text-xs" data-testid="select-country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("map.allCountries", { defaultValue: "All" })}</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === "map" ? (
        <div className="flex-1 relative overflow-hidden">
          {/* Immersive Floating Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setIs3D(!is3D)}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md transition-all border",
                is3D ? "bg-primary text-primary-foreground border-primary" : "bg-background/80 text-foreground border-border/60"
              )}
            >
              <Layers className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowSocial(!showSocial)}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md transition-all border",
                showSocial ? "bg-secondary text-secondary-foreground border-secondary" : "bg-background/80 text-foreground border-border/60"
              )}
            >
              <Sparkles className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsCompassOpen(!isCompassOpen)}
              className="w-10 h-10 rounded-2xl bg-background/80 text-foreground flex items-center justify-center shadow-lg backdrop-blur-md border border-border/60"
            >
              <Navigation2 className={cn("h-5 w-5 transition-transform", isCompassOpen && "rotate-45")} />
            </button>
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="w-10 h-10 rounded-2xl bg-background/80 text-foreground flex items-center justify-center shadow-lg backdrop-blur-md border border-border/60"
            >
              <CloudDownload className="h-5 w-5" />
            </button>
          </div>

          {/* Offline Region Modal */}
          <AnimatePresence>
            {isDownloadModalOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-background/20 backdrop-blur-sm"
              >
                <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-border/60 overflow-hidden">
                  <div className="p-6 border-b border-border/40 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">Offline Regions</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Download maps for remote areas</p>
                    </div>
                    <button onClick={() => setIsDownloadModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                       <Loader2 className={cn("h-5 w-5", downloadingRegion && "animate-spin")} />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { id: "tigray", name: "Tigray (Gheralta)", size: "45 MB" },
                      { id: "lalibela", name: "Lalibela & Surroundings", size: "32 MB" },
                      { id: "axum", name: "Axum Holy District", size: "18 MB" }
                    ].map(region => (
                      <div key={region.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/5 border border-secondary/10">
                        <div>
                          <div className="text-sm font-bold">{region.name}</div>
                          <div className="text-[10px] text-muted-foreground">{region.size}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={downloadingRegion === region.id ? "ghost" : "outline"}
                          className="rounded-full h-8 px-4 text-xs"
                          onClick={() => {
                            setDownloadingRegion(region.id);
                            let p = 0;
                            const int = setInterval(() => {
                              p += 10;
                              setDownloadProgress(p);
                              if(p >= 100) {
                                clearInterval(int);
                                setDownloadingRegion(null);
                                setDownloadProgress(0);
                                toast({ title: "Map Downloaded", description: `${region.name} is now available offline.` });
                              }
                            }, 300);
                          }}
                        >
                          {downloadingRegion === region.id ? `${downloadProgress}%` : "Download"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-muted/30 text-center">
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
                      Maps include high-detail topography, monastery POIs, and hiking trails.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Proximity Alert (Mock) */}
          {showSocial && (
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
              <div className="bg-background/90 backdrop-blur-md p-3 rounded-2xl border border-primary/20 shadow-xl flex items-center gap-3 pointer-events-auto max-w-sm mx-auto animate-in slide-in-from-bottom-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Nearby Insight</div>
                  <div className="text-xs text-foreground font-medium truncate">A pilgrim just shared a reflection in Axum</div>
                </div>
                <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
            </div>
          )}

          <GoogleMapView
            markers={markers}
            center={{ lat: 9.145, lng: 40.489673 }}
            zoom={6}
            className={cn("h-full transition-transform duration-1000", is3D && "perspective-1000 rotate-x-12")}
            fallback={
              <AdvancedMap
                markers={markers}
                center={[9.145, 40.489673]}
                zoom={6}
                className="h-full"
              />
            }
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-20">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto opacity-30 mb-3" />
              <p className="font-serif">{t("map.noChurches")}</p>
            </div>
          ) : (
            filtered.map((church) => (
              <Link key={church.id} href={`/churches/${church.id}`}>
                <div
                  className="flex gap-3 bg-card rounded-2xl p-3 border border-border/60 hover-elevate cursor-pointer"
                  data-testid={`row-church-${church.id}`}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img
                      src={church.imageUrl || "https://placehold.co/200"}
                      alt={church.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-foreground leading-tight line-clamp-2">
                      {church.name}
                    </h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {church.city}, {church.country}
                    </div>
                    {church.priest && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                        <User className="h-3 w-3" /> {church.priest}
                      </div>
                    )}
                    {church.liturgyTimes && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {church.liturgyTimes}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground self-center shrink-0" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
