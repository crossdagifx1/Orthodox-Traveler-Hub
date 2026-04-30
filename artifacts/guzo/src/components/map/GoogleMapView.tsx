import { useEffect, useMemo, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer, type Cluster } from "@googlemaps/markerclusterer";
import {
  Layers,
  Maximize2,
  Minimize2,
  Crosshair,
  Loader2,
  Navigation,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvancedMapMarker } from "./AdvancedMap";

/**
 * Super-advanced Google Maps embed for Guzo. Uses the Maps JavaScript API
 * with a hand-crafted Orthodox/parchment style, gold-cross SVG markers,
 * marker-clusterer with branded clusters, rich info-window cards, my-location
 * + fullscreen + map-type controls, and graceful fallback to OpenStreetMap
 * tiles when the API key fails to load.
 */

const ORTHODOX_GOLD = "#c8941f";
const ORTHODOX_GOLD_DARK = "#8a6618";

/**
 * Custom map style — warm parchment / gold Ethiopian Orthodox aesthetic.
 * Generated from a base Maps style and hand-tuned. Roads stay clear, POIs
 * fade back so churches stand out.
 */
const ORTHODOX_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f7f1e1" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5c4a2c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fff8e6" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c8941f" }, { weight: 1 }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a6618" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.place_of_worship",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.place_of_worship",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a6618" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#dfe7c8" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e8dcc1" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f5e1a4" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c8941f" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#bcd4dc" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d6b75" }],
  },
];

/** Render the gold Orthodox-cross marker as an inline data: SVG URL. */
function crossMarkerIcon(size = 36): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
      <defs>
        <radialGradient id="g" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0%" stop-color="#f5d76e"/>
          <stop offset="60%" stop-color="${ORTHODOX_GOLD}"/>
          <stop offset="100%" stop-color="${ORTHODOX_GOLD_DARK}"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="18" cy="18" r="15" fill="url(#g)" stroke="#fff8e6" stroke-width="2"/>
        <path d="M 18 8 L 18 28 M 11 13 L 25 13 M 13 18 L 23 18 M 11 23 L 25 23"
              stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </g>
    </svg>`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Cluster icon — golden circle with count, matching marker palette. */
function clusterIcon(count: number): string {
  const size = count < 10 ? 44 : count < 50 ? 56 : 70;
  const fontSize = count < 10 ? 14 : count < 50 ? 16 : 18;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <radialGradient id="cg" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0%" stop-color="#f5d76e"/>
          <stop offset="65%" stop-color="${ORTHODOX_GOLD}"/>
          <stop offset="100%" stop-color="${ORTHODOX_GOLD_DARK}"/>
        </radialGradient>
        <filter id="cs" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.45"/>
        </filter>
      </defs>
      <g filter="url(#cs)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="url(#cg)" stroke="#fff8e6" stroke-width="3"/>
      </g>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
            font-family="system-ui, sans-serif" font-weight="800" font-size="${fontSize}"
            fill="#fff">${count}</text>
    </svg>`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function safe(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function infoWindowHtml(m: AdvancedMapMarker): string {
  return `
    <div style="width:260px; font-family: system-ui, sans-serif; color:#1a1208;">
      ${
        m.imageUrl
          ? `<img src="${safe(m.imageUrl)}" style="width:100%; height:130px; object-fit:cover; border-top-left-radius:10px; border-top-right-radius:10px;" alt="${safe(m.title)}"/>`
          : ""
      }
      <div style="padding:12px;">
        ${
          m.badge
            ? `<div style="display:inline-block; padding:3px 10px; border-radius:999px; background:#fff8e6; color:#8a6618; font-size:10px; font-weight:700; letter-spacing:.05em; text-transform:uppercase;">${safe(m.badge)}</div>`
            : ""
        }
        <div style="font-weight:800; font-size:15px; margin-top:6px; line-height:1.2;">${safe(m.title)}</div>
        ${
          m.subtitle
            ? `<div style="font-size:12px; color:#5c4a2c; margin-top:3px;">${safe(m.subtitle)}</div>`
            : ""
        }
        ${
          m.meta && m.meta.length
            ? `<div style="margin-top:8px; display:flex; flex-direction:column; gap:3px;">${m.meta
                .map((x) => `<div style="font-size:11px; color:#5c4a2c;">${safe(x.label)}</div>`)
                .join("")}</div>`
            : ""
        }
        <div style="display:flex; gap:6px; margin-top:10px;">
          ${
            m.detailsHref
              ? `<a href="${safe(m.detailsHref)}" data-testid="popup-link-${m.id}"
                    style="flex:1; display:inline-block; text-align:center; padding:7px 10px; border-radius:8px; background:linear-gradient(135deg,#e5b341,#c8941f); color:#fff; font-weight:700; font-size:11px; text-decoration:none; letter-spacing:.05em; text-transform:uppercase;">View</a>`
              : ""
          }
          <a href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}"
             target="_blank" rel="noopener noreferrer"
             style="flex:1; display:inline-block; text-align:center; padding:7px 10px; border-radius:8px; background:#fff8e6; color:#8a6618; font-weight:700; font-size:11px; text-decoration:none; letter-spacing:.05em; text-transform:uppercase; border:1px solid #e8dcc1;">Directions</a>
        </div>
      </div>
    </div>`;
}

type Props = {
  markers: AdvancedMapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  /** When true, render the in-app fallback (Leaflet AdvancedMap) instead of trying Google. */
  forceFallback?: boolean;
  /** Renders this component when Google Maps cannot load. */
  fallback?: React.ReactNode;
};

export function GoogleMapView({
  markers,
  center,
  zoom = 6,
  className,
  forceFallback = false,
  fallback,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    forceFallback ? "error" : "loading",
  );
  const [mapType, setMapType] =
    useState<google.maps.MapTypeId | "styled">("styled");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;

  const mapCenter = useMemo<google.maps.LatLngLiteral>(
    () => center ?? { lat: 9.145, lng: 40.489673 },
    [center],
  );

  /** Init Google Maps once. */
  useEffect(() => {
    if (forceFallback || !apiKey || !containerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        // Configure the loader before importing libraries.
        setOptions({ key: apiKey, v: "weekly" });

        // Import the libraries we need in parallel.
        const [mapsLib, coreLib] = await Promise.all([
          importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          importLibrary("core") as Promise<google.maps.CoreLibrary>,
          importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
          importLibrary("places") as Promise<google.maps.PlacesLibrary>,
        ]);
        const { Map: GMap, InfoWindow } = mapsLib;
        const { ControlPosition } = coreLib;

        if (cancelled || !containerRef.current) return;

        const map = new GMap(containerRef.current, {
          center: mapCenter,
          zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: ORTHODOX_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: ControlPosition.RIGHT_BOTTOM },
          gestureHandling: "greedy",
          backgroundColor: "#f7f1e1",
          clickableIcons: false,
          tilt: 0,
          rotateControl: true,
        });

        mapRef.current = map;
        infoWindowRef.current = new InfoWindow({
          pixelOffset: new google.maps.Size(0, -8),
        });

        setStatus("ready");
      } catch (err) {
        console.error("[GoogleMapView] Failed to load Maps JS API", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, forceFallback]);

  /** Render markers + clusterer when map is ready or markers change. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    // Clean up previous markers & clusterer.
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    markersRef.current.forEach((mk) => mk.setMap(null));
    markersRef.current = [];

    const gMarkers = markers.map((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        icon: {
          url: crossMarkerIcon(36),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
        optimized: true,
      });
      marker.addListener("click", () => {
        if (!infoWindowRef.current) return;
        infoWindowRef.current.setContent(infoWindowHtml(m));
        infoWindowRef.current.open({ map, anchor: marker });
      });
      return marker;
    });

    markersRef.current = gMarkers;

    if (gMarkers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: gMarkers,
        renderer: {
          render: ({ count, position }: Cluster) => {
            return new google.maps.Marker({
              position,
              icon: {
                url: clusterIcon(count),
                scaledSize: new google.maps.Size(
                  count < 10 ? 44 : count < 50 ? 56 : 70,
                  count < 10 ? 44 : count < 50 ? 56 : 70,
                ),
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            });
          },
        },
      });
    }
  }, [markers, status]);

  /** Toggle map type / styled view. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    if (mapType === "styled") {
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      map.setOptions({ styles: ORTHODOX_MAP_STYLE });
    } else {
      map.setOptions({ styles: [] });
      map.setMapTypeId(mapType as google.maps.MapTypeId);
    }
  }, [mapType, status]);

  /** Fit map to all markers (Fit-All button). */
  const fitAll = () => {
    const map = mapRef.current;
    if (!map || markers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    map.fitBounds(bounds, 64);
  };

  /** Geolocate user. */
  const goToMyLocation = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(ll);
        map.setZoom(13);
        new google.maps.Marker({
          position: ll,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
            strokeColor: "#fff",
            strokeWeight: 3,
          },
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  /** Fullscreen toggle. */
  const toggleFullscreen = async () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await el.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /** Places autocomplete search (uses the same API key + Places library). */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const map = mapRef.current;
    if (!map || !searchQ.trim()) return;
    const service = new google.maps.places.PlacesService(map);
    service.textSearch({ query: searchQ.trim() }, (results, statusOk) => {
      if (statusOk !== google.maps.places.PlacesServiceStatus.OK || !results?.length) return;
      const first = results[0];
      if (first.geometry?.location) {
        map.setCenter(first.geometry.location);
        map.setZoom(13);
      }
    });
  };

  // ───────────────────────── render
  if (status === "error") {
    return (
      <div className={cn("relative w-full h-full bg-muted", className)}>
        {fallback ?? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-sm text-muted-foreground">
            <div>
              <div className="font-semibold mb-1">Map unavailable</div>
              <div className="text-xs">
                Google Maps could not be loaded. Check your API key and that the
                Maps JavaScript API + Places API are enabled in Google Cloud
                Console.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div ref={containerRef} className="absolute inset-0" />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f7f1e1] z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Top-left toolbar: Fit All + (parent provides Churches button). */}
      <div className="absolute top-3 left-3 z-[5] flex flex-wrap gap-2">
        <button
          type="button"
          onClick={fitAll}
          data-testid="map-fit-all"
          className="bg-white/95 backdrop-blur-sm hover:bg-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-black/5"
        >
          <Crosshair className="h-3.5 w-3.5" /> Fit All
        </button>
      </div>

      {/* Right-side toolbar */}
      <div className="absolute top-3 right-3 z-[5] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="h-9 w-9 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center border border-black/5"
          aria-label="Search"
        >
          {searchOpen ? <X className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTypeMenu((v) => !v)}
            className="h-9 w-9 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center border border-black/5"
            aria-label="Map style"
          >
            <Layers className="h-4 w-4" />
          </button>
          {showTypeMenu && (
            <div className="absolute right-12 top-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-black/5 overflow-hidden min-w-[140px]">
              {[
                { v: "styled", label: "Orthodox" },
                { v: "roadmap", label: "Standard" },
                { v: "satellite", label: "Satellite" },
                { v: "hybrid", label: "Hybrid" },
                { v: "terrain", label: "Terrain" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => {
                    setMapType(opt.v as any);
                    setShowTypeMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs hover:bg-amber-50 transition-colors",
                    mapType === opt.v && "bg-amber-50 font-semibold text-amber-900",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={goToMyLocation}
          className="h-9 w-9 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center border border-black/5"
          aria-label="My location"
        >
          <Navigation className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="h-9 w-9 bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center border border-black/5"
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {searchOpen && (
        <form
          onSubmit={handleSearch}
          className="absolute top-14 right-3 z-[5] bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-black/5 px-1 py-1 flex items-center gap-1 w-[220px]"
        >
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search a place…"
            className="flex-1 bg-transparent text-xs outline-none px-3"
            autoFocus
          />
          <button
            type="submit"
            className="h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center"
            aria-label="Submit search"
          >
            <SearchIcon className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
