import { useTranslation } from "react-i18next";
import { Link, useParams } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Share2, 
  Globe, 
  Lock, 
  Plus, 
  MoreVertical,
  CheckCircle2,
  Navigation
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ItineraryDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublic, setIsPublic] = useState(id === "1"); // Mocking initial state

  const itinerary = {
    id,
    title: id === "1" ? "Ancient Monasteries of Lake Tana" : "Lalibela Rock-Hewn Churches",
    description: id === "1" ? "A 3-day spiritual journey through the island monasteries." : "Exploring the New Jerusalem in the mountains of Wollo.",
    stops: [
      { id: "s1", name: "Ura Kidane Mehret", region: "Lake Tana", type: "Monastery" },
      { id: "s2", name: "Azwa Maryam", region: "Lake Tana", type: "Monastery" },
      { id: "s3", name: "Debre Maryam", region: "Lake Tana", type: "Monastery" },
    ]
  };

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsPublic(!isPublic);
    setIsPublishing(false);
  };

  return (
    <div className="pb-24 min-h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <Link href="/itineraries">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="rounded-full">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Info */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
            isPublic ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          )}>
            {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {isPublic ? "Public" : "Private"}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            3 Days
          </div>
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2 leading-tight">
          {itinerary.title}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {itinerary.description}
        </p>

        <Button 
          onClick={handleTogglePublish}
          disabled={isPublishing}
          variant={isPublic ? "outline" : "default"}
          className={cn(
            "w-full rounded-2xl h-12 font-bold transition-all",
            !isPublic && "shadow-lg shadow-primary/20"
          )}
        >
          {isPublishing ? (
            <div className="h-5 w-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
          ) : isPublic ? (
            <>Unpublish from Community</>
          ) : (
            <>Publish to Community</>
          )}
        </Button>
      </div>

      {/* Stops List */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Route Stops ({itinerary.stops.length})
          </h2>
          <Button variant="ghost" size="sm" className="text-primary h-8 gap-1 font-bold text-[10px] uppercase tracking-wider">
            <Plus className="h-3 w-3" /> Add Stop
          </Button>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
          {itinerary.stops.map((stop, idx) => (
            <div key={stop.id} className="relative">
              <div className="absolute -left-[19px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary z-10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              
              <Card className="p-4 border-border/60 hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {stop.type} • Stop {idx + 1}
                    </div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {stop.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" /> {stop.region}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Community Visibility Preview */}
      <AnimatePresence>
        {isPublic && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="m-4 p-5 rounded-3xl bg-green-50 border border-green-100 flex gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-green-800 text-sm">Visible to Community</h4>
              <p className="text-xs text-green-700 leading-relaxed mt-0.5">
                Fellow pilgrims can now find this itinerary in the community section and follow your route.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
