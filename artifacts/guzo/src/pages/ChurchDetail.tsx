import { useGetChurch, getGetChurchQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { MapPin, Phone, Globe, Clock, User as Priest, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EngagementSection } from "@/components/engagement/EngagementSection";
import { SeoHead } from "@/components/seo/SeoHead";

export function ChurchDetail() {
  const [, params] = useRoute("/churches/:id");
  const id = params?.id || "";

  const { data: church, isLoading } = useGetChurch(id, {
    query: { enabled: !!id, queryKey: getGetChurchQueryKey(id) }
  });

  if (isLoading) return <div className="p-4 space-y-4"><div className="w-full h-64 bg-muted animate-pulse rounded-2xl" /></div>;
  if (!church) return <div className="p-8 text-center">Church not found</div>;

  return (
    <div className="pb-24">
      <SeoHead
        title={church.name}
        description={church.description?.slice(0, 160) || `${church.address ?? ""}${church.city ? `, ${church.city}` : ""}${church.country ? `, ${church.country}` : ""}`.trim()}
        image={church.imageUrl}
        type="profile"
      />
      <div className="relative w-full aspect-[4/3] md:aspect-video">
        <img src={church.imageUrl || "https://placehold.co/800x600"} alt={church.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-5 -mt-6 relative z-10">
        <div className="bg-card p-6 rounded-3xl shadow-xl border border-border/50">
          <h1 className="text-2xl font-serif font-bold text-primary mb-2">{church.name}</h1>
          <p className="text-muted-foreground text-sm mb-6 flex items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{church.address}<br/>{church.city}, {church.country}</span>
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <Clock className="h-5 w-5 text-secondary" />
              <div>
                <div className="text-xs text-muted-foreground">Liturgy Times</div>
                <div className="text-sm font-medium">{church.liturgyTimes || "Contact for times"}</div>
              </div>
            </div>
            
            {church.priest && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <Priest className="h-5 w-5 text-secondary" />
                <div>
                  <div className="text-xs text-muted-foreground">Priest</div>
                  <div className="text-sm font-medium">{church.priest}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {church.phone && (
              <Button variant="outline" className="flex-1 rounded-full bg-background border-border shadow-sm">
                <Phone className="h-4 w-4 mr-2 text-primary" /> Call
              </Button>
            )}
            {church.website && (
              <Button variant="outline" className="flex-1 rounded-full bg-background border-border shadow-sm" onClick={() => window.open(church.website, "_blank")}>
                <Globe className="h-4 w-4 mr-2 text-primary" /> Website
              </Button>
            )}
          </div>

          {church.description && (
            <div className="mt-8 prose prose-sm dark:prose-invert">
              <h3 className="text-lg font-bold text-foreground">About</h3>
              <p className="text-muted-foreground">{church.description}</p>
            </div>
          )}
        </div>
      </div>

      <EngagementSection targetType="church" targetId={id} />
    </div>
  );
}
