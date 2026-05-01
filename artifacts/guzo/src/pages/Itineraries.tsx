import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Map, Calendar, Plus, ChevronRight, Share2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";

export function Itineraries() {
  const { t } = useTranslation();
  const { isAuthed, openLogin } = useAuth();

  // Mock data for demonstration
  const itineraries = [
    {
      id: "1",
      title: "Ancient Monasteries of Lake Tana",
      description: "A 3-day spiritual journey through the island monasteries.",
      itemCount: 7,
      isPublic: true,
      createdAt: "2024-04-20T10:00:00Z",
    },
    {
      id: "2",
      title: "Lalibela Rock-Hewn Churches",
      description: "Exploring the New Jerusalem in the mountains of Wollo.",
      itemCount: 11,
      isPublic: false,
      createdAt: "2024-04-25T14:30:00Z",
    }
  ];

  if (!isAuthed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Map className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">{t("itineraries.title", { defaultValue: "Your Pilgrimages" })}</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          {t("itineraries.loginPrompt", { defaultValue: "Sign in to plan your spiritual journeys and save holy sites to your itineraries." })}
        </p>
        <Button onClick={() => openLogin()} className="rounded-full px-8">
          {t("auth.signIn")}
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          {t("itineraries.title", { defaultValue: "My Pilgrimages" })}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("itineraries.subtitle", { defaultValue: "Plan and organize your spiritual journeys." })}
        </p>
      </header>

      <section className="px-4 space-y-4">
        <Button className="w-full rounded-2xl h-16 border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center gap-2 group transition-all">
          <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-xs">
            {t("itineraries.createNew", { defaultValue: "Create New Itinerary" })}
          </span>
        </Button>

        <div className="grid gap-4">
          {itineraries.map((it, idx) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={`/itineraries/${it.id}`}>
                <Card className="p-5 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/60">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-secondary/10 rounded-xl">
                      <Calendar className="h-5 w-5 text-secondary" />
                    </div>
                    {!it.isPublic && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {t("common.private", { defaultValue: "Private" })}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-1 group-hover:text-primary transition-colors">
                    {it.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {it.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {t("itineraries.stops", { count: it.itemCount, defaultValue: `${it.itemCount} Stops` })}
                    </div>
                    <div className="flex items-center gap-3">
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                         <Share2 className="h-4 w-4" />
                       </Button>
                       <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
