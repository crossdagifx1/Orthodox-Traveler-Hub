import { Link, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft, 
  Award, 
  Flame, 
  Star, 
  CheckCircle, 
  UserPlus,
  Users,
  MapPin,
  ShoppingBag,
  Camera,
  MessageCircle
} from "lucide-react";
import { 
  getGetPublicProfileQueryKey,
  useGetPublicProfile,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PublicProfile() {
  const { t } = useTranslation();
  const [, params] = useRoute("/u/:id");
  const id = params?.id || "";
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "itineraries" | "shop">("activity");

  const { data: profile, isLoading, error } = useGetPublicProfile(id, {
    query: { enabled: !!id, queryKey: getGetPublicProfileQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 flex flex-col items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          {t("profile.notFoundOrPrivate", {
            defaultValue: "This profile is private or does not exist.",
          })}
        </p>
        <Link href="/">
          <Button variant="ghost" data-testid="button-go-home">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const initials =
    (profile.name || "?")
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="pb-24">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <Link href="/">
          <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
          </Button>
        </Link>
      </header>

      <section className="px-4 pt-6 flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-3 shadow-lg ring-4 ring-card">
          <AvatarImage src={profile.avatarUrl} alt={profile.name} />
          <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold">{profile.name}</h1>
          {(profile as any).isVerified && (
            <CheckCircle className="h-4 w-4 text-primary fill-primary/10" />
          )}
        </div>
        {profile.bio && (
          <p className="text-sm text-foreground/80 mt-2 max-w-md italic">"{profile.bio}"</p>
        )}
        
        <div className="flex items-center gap-6 mt-4 mb-5">
           <div className="text-center">
             <div className="text-sm font-bold">1,240</div>
             <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Followers</div>
           </div>
           <div className="text-center">
             <div className="text-sm font-bold">342</div>
             <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Following</div>
           </div>
           <div className="text-center">
             <div className="text-sm font-bold">56</div>
             <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Activity</div>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full max-w-xs">
          <Button 
            variant={following ? "outline" : "default"} 
            size="sm" 
            className="flex-1 rounded-full font-bold shadow-md h-9"
            onClick={() => setFollowing(!following)}
          >
            {following ? "Following" : (
              <><UserPlus className="h-4 w-4 mr-1.5" /> Follow</>
            )}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full h-9 w-9 p-0">
             <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Tabs */}
      <div className="px-4 mt-8">
        <div className="flex gap-6 border-b border-border/40 pb-2 overflow-x-auto scrollbar-hide">
          {(["activity", "itineraries", "shop"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-xs font-bold uppercase tracking-[0.2em] pb-2 transition-all whitespace-nowrap px-1 relative",
                activeTab === tab ? "text-primary" : "text-muted-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-6">
        <AnimatePresence mode="wait">
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-secondary/5 rounded-3xl p-5 border border-secondary/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2 mb-4">
                  <Camera className="h-4 w-4" /> Recent Photos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1544126592-807daa2b567b",
                    "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0",
                    "https://images.unsplash.com/photo-1565451992095-26330084ba45"
                  ].map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                  <MessageCircle className="h-4 w-4" /> Spiritual Reflections
                </h3>
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Lalibela • 2 weeks ago</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                        Feeling deeply blessed to witness the beauty of the rock-hewn churches. The atmosphere of prayer here is unlike anywhere else...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "itineraries" && (
            <motion.div
              key="itineraries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {[
                { title: "Northern Monasteries", stops: 12, days: 7, img: "https://images.unsplash.com/photo-1590050752117-23a97b02bb17" },
                { title: "Lake Tana Hermitages", stops: 5, days: 3, img: "https://images.unsplash.com/photo-1544427920-c49ccfb85579" }
              ].map((it, i) => (
                <div key={i} className="bg-card border border-border/60 rounded-2xl overflow-hidden flex h-24 shadow-sm hover-elevate cursor-pointer">
                  <img src={it.img} className="w-24 h-full object-cover" alt="" />
                  <div className="p-3 flex flex-col justify-center">
                    <h4 className="font-bold text-sm mb-1">{it.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {it.stops} Stops</span>
                      <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {it.days} Days</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "shop" && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { title: "Hand-carved Cross", price: "450", img: "https://images.unsplash.com/photo-1548013146-72479768bada" },
                { title: "Sacred Incense", price: "120", img: "https://images.unsplash.com/photo-1555400038-63f5ba517a47" }
              ].map((item, i) => (
                <Card key={i} className="overflow-hidden border-border/60 shadow-sm rounded-2xl group cursor-pointer hover-elevate">
                  <div className="aspect-square bg-muted relative">
                    <img src={item.img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-md">
                       <ShoppingBag className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-xs font-bold text-foreground line-clamp-1 mb-1">{item.title}</h4>
                    <div className="text-sm font-bold text-primary">{item.price} ETB</div>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
