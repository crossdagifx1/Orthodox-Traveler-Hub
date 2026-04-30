import { useEffect, useMemo, useRef, useState } from "react";
import L, { type Map as LeafletMap, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import {
  Layers,
  Maximize2,
  Minimize2,
  Crosshair,
  Search as SearchIcon,
  Ruler,
  X,
  Loader2,
  Navigation,
  Church,
  MapPin,
  Building2,
  Layers3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEthiopianOrthodoxChurches, googlePlaceToMarker } from "@/hooks/useGooglePlaces";

/**
 * Free-tier "Mapbox + Google Maps killer". Multi-provider tile layers
 * (Esri Satellite/Hybrid, OSM, CartoDB Light/Dark, OpenTopoMap), marker
 * clustering, geolocation, fullscreen, search via Nominatim, distance
 * measurement and rich popups — all without any external API key.
 */

export type AdvancedMapMarker = {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  detailsHref?: string;
  badge?: string;
  meta?: Array<{ icon?: string; label: string }>;
};

type Layer = {
  key: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  satellite?: boolean;
  dark?: boolean;
};

const LAYERS: Layer[] = [
  {
    key: "street",
    label: "Street",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      "&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    maxZoom: 20,
  },
  {
    key: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
    satellite: true,
  },
  {
    key: "hybrid",
    label: "Hybrid",
    // Single-layer hybrid: Esri World_Imagery base + reference labels added
    // automatically by the layer-switch effect. Use the satellite URL here so
    // the base map is always present.
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics &middot; Labels &copy; Esri",
    maxZoom: 19,
    satellite: true,
  },
  {
    key: "terrain",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      "Map data: &copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> contributors, SRTM | Map style: &copy; <a href='https://opentopomap.org'>OpenTopoMap</a>",
    maxZoom: 17,
  },
  {
    key: "watercolor",
    label: "Watercolor",
    url: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
    attribution:
      "&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a> &copy; <a href='https://stamen.com/'>Stamen Design</a> &copy; OSM",
    maxZoom: 16,
  },
  {
    key: "osm",
    label: "OSM",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  {
    key: "dark",
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OSM &copy; CARTO",
    maxZoom: 20,
    dark: true,
  },
];

/** Reference labels overlay used on top of satellite imagery in Hybrid mode. */
const HYBRID_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

/** Custom gold Orthodox-cross divIcon. */
function makeCrossIcon(color = "#c8941f", size = 32): L.DivIcon {
  const html = `
    <div style="
      position:relative; width:${size}px; height:${size}px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
    ">
      <div style="
        position:absolute; inset:0; border-radius:50%;
        background: radial-gradient(circle at 30% 30%, ${color}ee, ${color}99);
        border: 2px solid #fff;
      "></div>
      <svg viewBox="0 0 24 24" width="${size}" height="${size}"
           style="position:absolute; inset:0;" fill="#fff" stroke="#fff" stroke-width="0.5">
        <path d="M11 4h2v3h3v2h-3v3h3v2h-3z"/>
      </svg>
    </div>`;
  return L.divIcon({
    html,
    className: "guzo-cross-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 + 2],
  });
}

/** Custom church icon with blue color to distinguish from regular markers */
function makeChurchIcon(size = 32): L.DivIcon {
  const html = `
    <div style="
      position:relative; width:${size}px; height:${size}px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
    ">
      <div style="
        position:absolute; inset:0; border-radius:50%;
        background: radial-gradient(circle at 30% 30%, #3b82f6ee, #2563eb99);
        border: 2px solid #fff;
      "></div>
      <svg viewBox="0 0 24 24" width="${size}" height="${size}"
           style="position:absolute; inset:0;" fill="#fff" stroke="#fff" stroke-width="0.5">
        <path d="M12 2L2 7v10l10 5V7L12 2z"/>
        <path d="M12 2L12 7m-6 0l-2 2m10-2l2-2"/>
        <path d="M12 12v6m3 0v-6"/>
      </svg>
    </div>`;
  return L.divIcon({
    html,
    className: "guzo-church-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 + 2],
  });
}

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export function AdvancedMap({
  markers,
  center,
  zoom = 5,
  className,
}: {
  markers: AdvancedMapMarker[];
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const clusterRef = useRef<any>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const measurePointsRef = useRef<L.LatLng[]>([]);

  const [layerKey, setLayerKey] = useState<string>("street");
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measureLabel, setMeasureLabel] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [routing, setRouting] = useState(false);
  const [routeStatus, setRouteStatus] = useState("");
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const routePointsRef = useRef<L.LatLng[]>([]);
  const [show3D, setShow3D] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showGoogleChurches, setShowGoogleChurches] = useState(true);

  // Fetch Ethiopian Orthodox churches from database
  const { data: googleChurchesData, isLoading: loadingChurches } = useEthiopianOrthodoxChurches();
  const googleChurches = googleChurchesData || [];

  // Combine markers with Google Places churches
  const allMarkers = useMemo(() => {
    const baseMarkers = markers;
    if (showGoogleChurches && googleChurches.length > 0) {
      const churchMarkers = googleChurches.map(googlePlaceToMarker);
      return [...baseMarkers, ...churchMarkers];
    }
    return baseMarkers;
  }, [markers, googleChurches, showGoogleChurches]);

  /** Keep `isFullscreen` in sync with the browser even when Esc / native UI is used. */
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /** Init map once. */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: center ?? [9.145, 40.489673],
      zoom,
      zoomControl: false,
      scrollWheelZoom: true,
      preferCanvas: true,
      worldCopyJump: true,
    });
    mapRef.current = map;
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Switch tile layer. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }
    const def = LAYERS.find((l) => l.key === layerKey) ?? LAYERS[0];
    const layer = L.tileLayer(def.url, {
      attribution: def.attribution,
      maxZoom: def.maxZoom ?? 19,
      detectRetina: true,
      // Pre-load tiles 2 rings outside the visible area for a smoother pan.
      keepBuffer: 4,
      // Tiny transparent PNG so failed tiles don't show "Map data not yet
      // available" placeholders from upstream CDNs.
      errorTileUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      crossOrigin: true,
    });
    layer.addTo(map);
    tileLayerRef.current = layer;
    // Hybrid mode = satellite base + reference labels overlay on top.
    if (def.key === "hybrid") {
      const labels = L.tileLayer(HYBRID_LABELS_URL, {
        attribution: "Labels &copy; Esri",
        maxZoom: 19,
        detectRetina: true,
        pane: "shadowPane",
      });
      labels.addTo(map);
      labelsLayerRef.current = labels;
    }
  }, [layerKey]);

  /** Cluster + markers. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }
    const cluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        const size = count < 10 ? 36 : count < 50 ? 44 : 56;
        return L.divIcon({
          html: `<div style="
            display:flex; align-items:center; justify-content:center;
            width:${size}px; height:${size}px; border-radius:50%;
            background: radial-gradient(circle, #e5b341 0%, #c8941f 70%, #8a6618 100%);
            color:#fff; font-weight:800; font-family: system-ui, sans-serif;
            font-size:${size > 50 ? 16 : 13}px;
            border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ">${count}</div>`,
          className: "guzo-cluster",
          iconSize: [size, size],
        });
      },
    });
    clusterRef.current = cluster;

    allMarkers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: makeCrossIcon() });
      const safe = (s: string) =>
        s.replace(/[&<>"']/g, (c) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
        );
      const html = `
        <div style="width:240px; font-family: system-ui, sans-serif;">
          ${m.imageUrl ? `<img src="${safe(m.imageUrl)}" style="width:100%; height:110px; object-fit:cover; border-top-left-radius:8px; border-top-right-radius:8px;"/>` : ""}
          <div style="padding:10px;">
            ${m.badge ? `<div style="display:inline-block; padding:2px 8px; border-radius:999px; background:#fff8e6; color:#8a6618; font-size:10px; font-weight:700; letter-spacing:.05em; text-transform:uppercase;">${safe(m.badge)}</div>` : ""}
            <div style="font-weight:800; font-size:14px; margin-top:4px; color:#1a1208;">${safe(m.title)}</div>
            ${m.subtitle ? `<div style="font-size:12px; color:#5c4a2c; margin-top:2px;">${safe(m.subtitle)}</div>` : ""}
            ${
              m.meta && m.meta.length
                ? `<div style="margin-top:6px; display:flex; flex-direction:column; gap:2px;">${m.meta
                    .map(
                      (x) =>
                        `<div style="font-size:11px; color:#5c4a2c;">${safe(x.label)}</div>`,
                    )
                    .join("")}</div>`
                : ""
            }
            ${
              m.detailsHref
                ? `<a href="${safe(m.detailsHref)}"
                       data-testid="popup-link-${m.id}"
                       style="display:block; margin-top:8px; padding:6px 12px; border-radius:999px;
                              background: linear-gradient(135deg,#e5b341,#c8941f);
                              color:#fff; text-decoration:none; font-size:12px;
                              font-weight:700; text-align:center;">
                       View details →
                     </a>`
                : ""
            }
          </div>
        </div>`;
      marker.bindPopup(html, { maxWidth: 260, closeButton: true });
      cluster.addLayer(marker);
    });

    cluster.addTo(map);

    // Auto-fit bounds when we have markers.
    if (allMarkers.length > 0) {
      const bounds = L.latLngBounds(allMarkers.map((m) => [m.lat, m.lng] as [number, number]));
      try {
        map.fitBounds(bounds.pad(0.15), { maxZoom: 8, animate: true });
      } catch {
        /* ignore */
      }
    }
  }, [allMarkers]);

  /** Measure tool: click points to draw segments + total distance. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!measuring) {
      if (measureLayerRef.current) {
        map.removeLayer(measureLayerRef.current);
        measureLayerRef.current = null;
      }
      measurePointsRef.current = [];
      setMeasureLabel("");
      return;
    }
    const layer = L.layerGroup().addTo(map);
    measureLayerRef.current = layer;

    const handler = (e: L.LeafletMouseEvent) => {
      measurePointsRef.current.push(e.latlng);
      L.circleMarker(e.latlng, {
        radius: 4,
        color: "#c8941f",
        fillColor: "#fff",
        fillOpacity: 1,
        weight: 2,
      }).addTo(layer);
      if (measurePointsRef.current.length >= 2) {
        L.polyline(measurePointsRef.current, {
          color: "#c8941f",
          weight: 3,
          opacity: 0.85,
          dashArray: "6 4",
        }).addTo(layer);
      }
      let dist = 0;
      for (let i = 1; i < measurePointsRef.current.length; i++) {
        dist += measurePointsRef.current[i - 1].distanceTo(measurePointsRef.current[i]);
      }
      setMeasureLabel(
        dist > 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist.toFixed(0)} m`,
      );
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [measuring]);

  /**
   * OSRM driving directions: tap two points on the map (A → B). Uses the
   * public OSRM demo server (free, no key). Draws a route polyline and
   * shows total distance + duration.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!routing) {
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      routePointsRef.current = [];
      setRouteStatus("");
      return;
    }
    const layer = L.layerGroup().addTo(map);
    routeLayerRef.current = layer;
    setRouteStatus("Tap point A on the map");

    const fetchRoute = async (a: L.LatLng, b: L.LatLng) => {
      try {
        setRouteStatus("Calculating route…");
        const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
        const r = await fetch(url);
        if (!r.ok) throw new Error("OSRM error");
        const j = await r.json();
        const route = j?.routes?.[0];
        if (!route) {
          setRouteStatus("No route found");
          return;
        }
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng],
        );
        L.polyline(coords, { color: "#c8941f", weight: 5, opacity: 0.9 }).addTo(layer);
        const km = (route.distance / 1000).toFixed(1);
        const min = Math.round(route.duration / 60);
        setRouteStatus(`${km} km · ${min} min driving`);
        try {
          map.fitBounds(L.latLngBounds(coords).pad(0.2), { animate: true });
        } catch {
          /* ignore */
        }
      } catch {
        setRouteStatus("Route lookup failed");
      }
    };

    const handler = (e: L.LeafletMouseEvent) => {
      routePointsRef.current.push(e.latlng);
      const isStart = routePointsRef.current.length === 1;
      L.marker(e.latlng, {
        icon: L.divIcon({
          html: `<div style="
            background:${isStart ? "#10b981" : "#ef4444"};
            color:#fff; font-weight:800; font-size:11px;
            width:24px;height:24px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,.4);
          ">${isStart ? "A" : "B"}</div>`,
          className: "guzo-route-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(layer);
      if (routePointsRef.current.length === 1) {
        setRouteStatus("Tap point B on the map");
      } else if (routePointsRef.current.length === 2) {
        const [a, b] = routePointsRef.current;
        fetchRoute(a, b);
      } else {
        // Reset and start over.
        layer.clearLayers();
        routePointsRef.current = [e.latlng];
        L.marker(e.latlng, {
          icon: L.divIcon({
            html: `<div style="background:#10b981;color:#fff;font-weight:800;font-size:11px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.4);">A</div>`,
            className: "guzo-route-marker",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(layer);
        setRouteStatus("Tap point B on the map");
      }
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [routing]);

  /** Geolocate user. */
  const locateMe = () => {
    const map = mapRef.current;
    if (!map) return;
    map.locate({ setView: true, maxZoom: 12, enableHighAccuracy: true });
    map.once("locationfound", (e: L.LocationEvent) => {
      L.circle(e.latlng, { radius: e.accuracy, color: "#c8941f", weight: 1 }).addTo(map);
    });
  };

  /** Toggle fullscreen on the wrapper. */
  const toggleFullscreen = async () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen();
        setIsFullscreen(true);
        setTimeout(() => mapRef.current?.invalidateSize(), 200);
      } catch {
        /* ignore */
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setTimeout(() => mapRef.current?.invalidateSize(), 200);
      } catch {
        /* ignore */
      }
    }
  };

  /** Nominatim search (free, no key). */
  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const j: SearchResult[] = await r.json();
      setSearchResults(j);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const flyTo = (lat: number, lng: number, z = 13) => {
    mapRef.current?.flyTo([lat, lng], z, { duration: 1.2 });
  };

  const layerDef = useMemo(
    () => LAYERS.find((l) => l.key === layerKey) ?? LAYERS[0],
    [layerKey],
  );

  return (
    <div className={cn("relative w-full h-full", className)} data-testid="advanced-map">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top-right toolbar */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <button
            type="button"
            aria-label="Search location"
            onClick={() => setSearchOpen((v) => !v)}
            data-testid="button-map-search"
            className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2"
          >
            <SearchIcon className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Switch layers"
            onClick={() => setShowLayerMenu((v) => !v)}
            data-testid="button-map-layers"
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2",
              showLayerMenu ? "bg-primary text-primary-foreground" : "bg-background/95 text-foreground",
            )}
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Toggle Google Churches"
            onClick={() => setShow3D(!show3D)}
            data-testid="button-map-3d"
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2",
              show3D ? "bg-primary text-primary-foreground" : "bg-background/95 text-foreground",
            )}
            title="Toggle 3D Buildings"
          >
            <Building2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Toggle Ethiopian Churches"
            onClick={() => setShowGoogleChurches(!showGoogleChurches)}
            data-testid="button-map-churches"
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2",
              showGoogleChurches ? "bg-primary text-primary-foreground" : "bg-background/95 text-foreground",
            )}
            title="Toggle Ethiopian Orthodox Churches"
          >
            <Church className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Locate me"
            onClick={locateMe}
            data-testid="button-map-locate"
            className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2"
          >
            <Crosshair className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Driving directions"
            onClick={() => {
              setRouting((v) => !v);
              if (!routing) setMeasuring(false);
            }}
            data-testid="button-map-directions"
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2",
              routing ? "bg-primary text-primary-foreground" : "bg-background/95 text-foreground",
            )}
          >
            <Navigation className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Measure distance"
            onClick={() => {
              setMeasuring((v) => !v);
              if (!measuring) setRouting(false);
            }}
            data-testid="button-map-measure"
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2",
              measuring ? "bg-primary text-primary-foreground" : "bg-background/95 text-foreground",
            )}
          >
            <Ruler className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Fullscreen"
            onClick={toggleFullscreen}
            data-testid="button-map-fullscreen"
            className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md border border-border/60 shadow-md flex items-center justify-center hover-elevate active-elevate-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-foreground" />
            ) : (
              <Maximize2 className="h-4 w-4 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Layer panel */}
      {showLayerMenu && (
        <div
          className="absolute top-3 right-16 z-[401] w-44 rounded-2xl bg-background/95 backdrop-blur-md border border-border/60 shadow-xl p-2 pointer-events-auto"
          data-testid="panel-map-layers"
        >
          <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Map type
          </div>
          {LAYERS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => {
                setLayerKey(l.key);
                setShowLayerMenu(false);
              }}
              data-testid={`button-layer-${l.key}`}
              className={cn(
                "w-full text-left px-2.5 py-2 rounded-lg text-sm flex items-center justify-between hover-elevate active-elevate-2",
                layerKey === l.key && "bg-primary/15 text-primary font-semibold",
              )}
            >
              <span>{l.label}</span>
              {layerKey === l.key && <span className="text-xs">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[401] w-[88%] max-w-md pointer-events-auto">
          <div className="rounded-2xl bg-background/95 backdrop-blur-md border border-border/60 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <SearchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value);
                  if (e.target.value.length > 2) runSearch(e.target.value);
                }}
                placeholder="Search any place — city, address, landmark…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                data-testid="input-map-search"
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch(searchQ);
                }}
              />
              {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchResults([]);
                  setSearchQ("");
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="max-h-72 overflow-auto border-t border-border/40">
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        flyTo(parseFloat(r.lat), parseFloat(r.lon), 12);
                        setSearchOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs hover-elevate active-elevate-2 border-b border-border/30 last:border-0"
                      data-testid={`result-search-${i}`}
                    >
                      {r.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Measure label */}
      {measuring && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div
            className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold shadow-lg"
            data-testid="status-measure"
          >
            {measureLabel || "Tap on the map to measure distance"}
          </div>
        </div>
      )}

      {/* Routing label */}
      {routing && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div
            className="rounded-full bg-secondary text-secondary-foreground px-4 py-1.5 text-xs font-bold shadow-lg"
            data-testid="status-route"
          >
            {routeStatus || "Tap point A on the map"}
          </div>
        </div>
      )}

      {/* Layer label badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[399] pointer-events-none">
        <div
          className={cn(
            "rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold backdrop-blur-md border border-border/60 shadow",
            layerDef.dark
              ? "bg-black/70 text-white"
              : layerDef.satellite
                ? "bg-black/70 text-white"
                : "bg-background/85 text-foreground",
          )}
        >
          {layerDef.label}
        </div>
      </div>

      {/* Loading indicator for Google churches */}
      {loadingChurches && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[399] pointer-events-none">
          <div className="rounded-full bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold shadow-lg flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading churches...
          </div>
        </div>
      )}

      {/* Church count badge */}
      {googleChurches && googleChurches.length > 0 && (
        <div className="absolute bottom-16 right-3 z-[399] pointer-events-none">
          <div className="rounded-full bg-secondary/90 text-secondary-foreground px-3 py-1.5 text-[10px] font-bold shadow-lg flex items-center gap-1.5">
            <Church className="h-3 w-3" />
            {googleChurches.length} churches
          </div>
        </div>
      )}

      {/* Quick filter buttons */}
      <div className="absolute top-3 left-3 z-[400] flex gap-2 pointer-events-none">
        <div className="flex gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (allMarkers.length > 0) {
                const bounds = L.latLngBounds(allMarkers.map((m) => [m.lat, m.lng] as [number, number]));
                mapRef.current?.fitBounds(bounds.pad(0.1), { maxZoom: 10, animate: true });
              }
            }}
            className="h-10 px-4 rounded-full bg-background/95 backdrop-blur-md border border-border/60 shadow-md flex items-center gap-2 text-xs font-semibold hover-elevate active-elevate-2"
            data-testid="button-map-fit-bounds"
          >
            <MapPin className="h-3 w-3" />
            Fit All
          </button>
          <button
            type="button"
            onClick={() => {
              if (googleChurches && googleChurches.length > 0) {
                const bounds = L.latLngBounds(googleChurches.map((m) => [m.geometry.location.lat, m.geometry.location.lng]));
                mapRef.current?.fitBounds(bounds.pad(0.1), { maxZoom: 12, animate: true });
              }
            }}
            disabled={!googleChurches || googleChurches.length === 0}
            className="h-10 px-4 rounded-full bg-background/95 backdrop-blur-md border border-border/60 shadow-md flex items-center gap-2 text-xs font-semibold hover-elevate active-elevate-2 disabled:opacity-50"
            data-testid="button-map-fit-churches"
          >
            <Church className="h-3 w-3" />
            Churches
          </button>
        </div>
      </div>
    </div>
  );
}
