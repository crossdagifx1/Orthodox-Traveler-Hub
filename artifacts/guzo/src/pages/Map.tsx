import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useListChurches, getListChurchesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export function Map() {
  const { data: churches } = useListChurches({}, { query: { queryKey: getListChurchesQueryKey({}) } });

  // Center around Ethiopia by default
  const defaultCenter: [number, number] = [9.145, 40.489673];

  return (
    <div className="h-full w-full relative z-0">
      <div className="absolute top-4 left-4 right-4 z-[400] pointer-events-none">
        <div className="bg-background/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-border/50 pointer-events-auto">
          <h1 className="text-lg font-serif font-bold text-primary">Find a Church</h1>
          <p className="text-xs text-muted-foreground">Discover Orthodox churches worldwide</p>
        </div>
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        scrollWheelZoom={true} 
        className="w-full h-[calc(100vh-64px)] md:h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {churches?.map((church) => (
          <Marker key={church.id} position={[church.latitude, church.longitude]}>
            <Popup className="rounded-xl overflow-hidden shadow-xl border-0 p-0 m-0">
              <div className="w-[200px] flex flex-col p-1">
                <img src={church.imageUrl || "https://placehold.co/400x200"} className="w-full h-24 object-cover rounded-t-lg" alt={church.name} />
                <div className="p-3">
                  <h3 className="font-bold text-sm leading-tight text-foreground font-serif">{church.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{church.city}, {church.country}</p>
                  <Link href={`/churches/${church.id}`}>
                    <span className="text-xs font-medium text-primary mt-2 block hover:underline">View details →</span>
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
