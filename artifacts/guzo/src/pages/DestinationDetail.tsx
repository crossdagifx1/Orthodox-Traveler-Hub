import { useGetDestination, getGetDestinationQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { MapPin, Calendar, Info, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DestinationDetail() {
  const [, params] = useRoute("/destinations/:id");
  const id = params?.id || "";

  const { data: dest, isLoading } = useGetDestination(id, {
    query: { enabled: !!id, queryKey: getGetDestinationQueryKey(id) }
  });

  if (isLoading) {
    return <div className="p-4 space-y-4"><div className="w-full h-64 bg-muted animate-pulse rounded-2xl" /></div>;
  }

  if (!dest) return <div className="p-8 text-center">Destination not found</div>;

  return (
    <div className="pb-24">
      <div className="relative w-full aspect-[4/3] md:aspect-video">
        <img src={dest.imageUrl || "https://placehold.co/800x600"} alt={dest.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-5 -mt-6 relative z-10">
        <div className="bg-card p-6 rounded-3xl shadow-xl border border-border/50">
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">{dest.name}</h1>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              <MapPin className="h-4 w-4 mr-1 text-primary" /> {dest.region}, {dest.country}
            </div>
            {dest.founded && (
              <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                <Info className="h-4 w-4 mr-1 text-primary" /> Est. {dest.founded}
              </div>
            )}
            {dest.feastDay && (
              <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                <Calendar className="h-4 w-4 mr-1 text-primary" /> Feast: {dest.feastDay}
              </div>
            )}
          </div>

          <div className="prose prose-sm dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-headings:font-serif max-w-none">
            <h3 className="text-lg font-bold text-foreground">About</h3>
            <p>{dest.description}</p>
          </div>
          
          {dest.gallery && dest.gallery.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-serif font-bold text-foreground mb-3 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Gallery
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x -mr-6 pr-6">
                {dest.gallery.map((img, i) => (
                  <img key={i} src={img} alt={`${dest.name} ${i}`} className="w-40 h-40 object-cover rounded-xl snap-start shrink-0" />
                ))}
              </div>
            </div>
          )}

          <Button className="w-full mt-6 rounded-full h-12 text-base font-medium shadow-md">Plan a Visit</Button>
        </div>
      </div>
    </div>
  );
}
