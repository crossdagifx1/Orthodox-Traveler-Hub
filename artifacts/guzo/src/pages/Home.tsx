import { useGetStatsOverview, useListFeaturedDestinations, useListTrendingMezmurs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";

export function Home() {
  const { data: stats } = useGetStatsOverview();
  const { data: featuredDestinations } = useListFeaturedDestinations();
  const { data: trendingMezmurs } = useListTrendingMezmurs();

  return (
    <div className="pb-8">
      {/* Hero Section */}
      <section className="relative w-full aspect-[4/5] max-h-[600px] flex items-end p-6">
        <img src="/images/hero-bg.png" alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="relative z-10 w-full">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Welcome to Guzo</h1>
          <p className="text-muted-foreground text-lg mb-6">Discover the ancient path of Ethiopian Orthodox Christianity.</p>
          <div className="flex gap-4">
            <Link href="/destinations">
              <span className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 hover-elevate cursor-pointer">
                Start Journey <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 -mt-4 relative z-20">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-4 grid grid-cols-3 gap-4 text-center divide-x divide-border">
          <div>
            <div className="text-2xl font-bold font-serif text-primary">{stats?.destinations || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Holy Sites</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-primary">{stats?.churches || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Churches</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-primary">{stats?.mezmurs || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Mezmurs</div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="mt-10 pl-4">
        <div className="flex items-center justify-between pr-4 mb-4">
          <h2 className="text-xl font-serif font-bold text-foreground">Featured Destinations</h2>
          <Link href="/destinations">
            <span className="text-sm font-medium text-primary flex items-center gap-1 cursor-pointer">
              View all <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-4 -mr-4 scrollbar-hide">
          {featuredDestinations?.map((dest) => (
            <Link key={dest.id} href={`/destinations/${dest.id}`}>
              <Card className="w-[280px] shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-95 group border-0 shadow-md">
                <div className="aspect-[4/3] relative">
                  <img src={dest.imageUrl || "https://placehold.co/400x300"} alt={dest.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1">{dest.name}</h3>
                    <div className="flex items-center text-white/80 text-xs font-medium">
                      <MapPin className="h-3 w-3 mr-1" /> {dest.region}, {dest.country}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
