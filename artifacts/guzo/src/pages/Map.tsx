import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useListChurches, getListChurchesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Search, MapPin, List, Map as MapIcon, Globe2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export function Map() {
  const { t } = useTranslation();
  const [view, setView] = useState<"map" | "list">("map");
  const [country, setCountry] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: churches } = useListChurches(
    {},
    { query: { queryKey: getListChurchesQueryKey({}) } },
  );

  const countries = useMemo(() => {
    const set = new Set<string>();
    (churches ?? []).forEach((c) => c.country && set.add(c.country));
    return Array.from(set).sort();
  }, [churches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (churches ?? []).filter((c) => {
      if (country !== "all" && c.country !== country) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
      );
    });
  }, [churches, country, search]);

  const defaultCenter: [number, number] = [9.145, 40.489673];

  return (
    <div className="h-full w-full relative bg-background flex flex-col" data-testid="page-map">
      <div className="px-4 pt-4 pb-2 z-30 bg-background/85 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-lg font-serif font-bold text-primary">{t("map.title")}</h1>
            <p className="text-[11px] text-muted-foreground">{t("map.subtitle")}</p>
          </div>
          <div className="flex bg-card border border-border/60 rounded-full p-0.5 shadow-sm">
            <button
              onClick={() => setView("map")}
              data-testid="button-view-map"
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 hover-elevate active-elevate-2",
                view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <MapIcon className="h-3 w-3" /> {t("map.viewMap")}
            </button>
            <button
              onClick={() => setView("list")}
              data-testid="button-view-list"
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 hover-elevate active-elevate-2",
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <List className="h-3 w-3" /> {t("map.viewList")}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("map.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-card border-border/60 rounded-full text-sm"
              data-testid="input-search-churches"
            />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger
              className="h-9 w-[130px] rounded-full text-xs border-border/60 bg-card"
              data-testid="select-country"
            >
              <Globe2 className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("map.allCountries")}</SelectItem>
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
        <div className="flex-1 relative">
          <MapContainer
            center={defaultCenter}
            zoom={3}
            scrollWheelZoom
            className="absolute inset-0 z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((church) => (
              <Marker
                key={church.id}
                position={[church.latitude, church.longitude]}
              >
                <Popup className="rounded-xl overflow-hidden shadow-xl border-0 p-0 m-0">
                  <div className="w-[210px] flex flex-col p-1">
                    <img
                      src={church.imageUrl || "https://placehold.co/400x200"}
                      className="w-full h-24 object-cover rounded-t-lg"
                      alt={church.name}
                    />
                    <div className="p-3">
                      <h3 className="font-bold text-sm leading-tight text-foreground font-serif">
                        {church.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {church.city}, {church.country}
                      </p>
                      <Link href={`/churches/${church.id}`}>
                        <span className="text-xs font-semibold text-primary mt-2 inline-flex items-center gap-1 cursor-pointer hover:underline">
                          {t("nav.viewAll")} →
                        </span>
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="absolute bottom-4 left-4 right-4 z-[400] pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md border border-border/60 rounded-2xl px-4 py-2 shadow-md text-center pointer-events-auto">
              <span className="text-xs font-semibold tabular-nums">
                {filtered.length} {filtered.length === 1 ? t("nav.map") : t("nav.map")}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    {church.address && (
                      <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                        {church.address}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
