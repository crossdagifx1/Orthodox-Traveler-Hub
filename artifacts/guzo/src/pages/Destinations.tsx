import { useListDestinations, getListDestinationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export function Destinations() {
  const [search, setSearch] = useState("");
  const { data: destinations, isLoading } = useListDestinations(
    { q: search || undefined },
    { query: { queryKey: getListDestinationsQueryKey({ q: search || undefined }) } }
  );

  return (
    <div className="p-4 pb-20">
      <div className="mb-6 sticky top-0 bg-background/95 backdrop-blur z-10 py-2 -mx-4 px-4 border-b border-border/50">
        <h1 className="text-2xl font-serif font-bold text-primary mb-4">Holy Destinations</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search destinations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50 rounded-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full h-48 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : destinations?.length === 0 ? (
        <div className="text-center py-20">
          <img src="/images/empty-scroll.png" alt="Empty" className="w-32 h-32 mx-auto opacity-50 mb-4 rounded-xl mix-blend-multiply" />
          <p className="text-muted-foreground font-serif text-lg">No destinations found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {destinations?.map((dest) => (
            <Link key={dest.id} href={`/destinations/${dest.id}`}>
              <Card className="overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-[0.98] border-border/50 shadow-sm rounded-2xl group">
                <div className="aspect-video relative">
                  <img 
                    src={dest.imageUrl || "https://placehold.co/600x400"} 
                    alt={dest.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h2 className="text-white font-serif font-bold text-xl mb-1">{dest.name}</h2>
                    <div className="flex items-center text-white/80 text-sm">
                      <MapPin className="h-4 w-4 mr-1" /> {dest.region}, {dest.country}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
