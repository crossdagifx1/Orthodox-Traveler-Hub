import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { 
  ChevronLeft, 
  BookOpen, 
  Sun, 
  Moon, 
  Heart, 
  Search,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "morning", icon: Sun, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "evening", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "intercession", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "special", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50" },
];

const MOCK_PRAYERS = [
  {
    id: 1,
    title: "The Lord's Prayer (Our Father)",
    amTitle: "አባታችን ሆይ",
    category: "morning",
    excerpt: "Our Father, who art in heaven, hallowed be thy name...",
    amExcerpt: "አባታችን ሆይ በሰማያት የምትኖር ስምህ ይቀደስ..."
  },
  {
    id: 2,
    title: "Prayer of Thanksgiving",
    amTitle: "የምስጋና ጸሎት",
    category: "morning",
    excerpt: "We give thanks to You, O Lord our God, for every condition...",
    amExcerpt: "ስለ ሁሉም ነገር አምላካችን እግዚአብሔርን እናመሰግናለን..."
  },
  {
    id: 3,
    title: "Evening Prayer to the Guardian Angel",
    amTitle: "የማታ ጸሎት ለጠባቂ መልአክ",
    category: "evening",
    excerpt: "O holy angel, who stands before my wretched soul...",
    amExcerpt: "አንተ ቅዱስ መልአክ ሆይ፣ በነፍሴ ፊት የምትቆም..."
  }
];

export function Prayers() {
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const isAmharic = i18n.language === "am";

  const filteredPrayers = MOCK_PRAYERS.filter(p => {
    const matchesCat = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = (p.title + p.amTitle).toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-full pb-24 bg-background">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-primary/80 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80" 
          className="w-full h-full object-cover"
          alt="Prayers Background"
        />
        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
          <Link href="/">
            <button className="absolute top-6 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-white mb-1">
            {t("prayers.title")}
          </h1>
          <p className="text-white/80 text-sm italic">
            {t("prayers.subtitle")}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 space-y-4 -mt-6 relative z-30">
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-2 flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground ml-2" />
          <input 
            type="text" 
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm h-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              activeCategory === "all" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {t("common.all")}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all",
                activeCategory === cat.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {t(`prayers.cat.${cat.id}`, { defaultValue: cat.id.charAt(0).toUpperCase() + cat.id.slice(1) })}
            </button>
          ))}
        </div>
      </div>

      {/* Prayers List */}
      <div className="px-4 space-y-3">
        {filteredPrayers.length > 0 ? (
          filteredPrayers.map((prayer) => {
            const cat = CATEGORIES.find(c => c.id === prayer.category);
            return (
              <Link key={prayer.id} href={`/prayers/${prayer.id}`}>
                <div className="bg-card p-4 rounded-2xl border border-border/60 shadow-sm flex gap-4 cursor-pointer hover:border-primary/50 transition-colors">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", cat?.bg)}>
                    {cat && <cat.icon className={cn("h-6 w-6", cat.color)} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">
                      {isAmharic ? prayer.amTitle : prayer.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {isAmharic ? prayer.amExcerpt : prayer.excerpt}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-20 mb-3" />
            <p className="text-muted-foreground italic">
              {t("prayers.empty")}
            </p>
          </div>
        )}
      </div>

      {/* Featured Insight */}
      <div className="m-4 p-6 rounded-3xl bg-secondary/10 border border-secondary/20 relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-secondary font-bold text-xs uppercase tracking-widest mb-2">Did you know?</h4>
          <p className="text-sm text-foreground leading-relaxed italic">
            "Prayer is the spiritual breathing of the soul." — St. Gregory of Nyssa
          </p>
        </div>
        <Sparkles className="absolute -right-4 -bottom-4 h-24 w-24 text-secondary/10" />
      </div>
    </div>
  );
}
