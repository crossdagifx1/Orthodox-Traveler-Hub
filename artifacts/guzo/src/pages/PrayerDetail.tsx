import { useTranslation } from "react-i18next";
import { Link, useParams } from "wouter";
import { 
  ChevronLeft, 
  Heart, 
  Share2, 
  Type,
  Maximize2,
  Download,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useOffline } from "@/hooks/useOffline";

const MOCK_PRAYERS: Record<string, any> = {
  "1": {
    title: "The Lord's Prayer (Our Father)",
    amTitle: "አባታችን ሆይ",
    content: `Our Father, who art in heaven, 
hallowed be thy name; 
thy kingdom come; 
thy will be done 
on earth as it is in heaven. 
Give us this day our daily bread; 
and forgive us our trespasses 
as we forgive those who trespass against us; 
and lead us not into temptation, 
but deliver us from evil. 

For thine is the kingdom, 
and the power, and the glory, 
for ever and ever. Amen.`,
    amContent: `አባታችን ሆይ በሰማያት የምትኖር 
ስምህ ይቀደስ፤ 
መንግሥትህ ትምጣ፤ 
ፈቃድህ በሰማይ እንደሆነች 
እንዲሁም በምድር ትሁን። 
የዕለት እንጀራችንን ስጠን ዛሬ፤ 
በደላችንንም ይቅር በለን 
እኛም የበደሉንን ይቅር እንደምንል። 
ወደ ፈተናም አታግባን 
ከክፉ ሁሉ አድነን እንጂ 

መንግሥት ያንተ ናትና 
ኃይልም ምስጋናም 
ለዘላለሙ አሜን።`
  },
  "2": {
    title: "Prayer of Thanksgiving",
    amTitle: "የምስጋና ጸሎት",
    content: "We give thanks to You, O Lord our God, for every condition, for any condition, and in every condition...",
    amContent: "ስለ ሁሉም ነገር አምላካችን እግዚአብሔርን እናመሰግናለን..."
  },
  "3": {
    title: "Morning Prayer",
    amTitle: "የማለዳ ጸሎት",
    content: "O Holy Trinity, have mercy on us. O Lord, cleanse us from our sins...",
    amContent: "ቅድስት ሥላሴ ሆይ ማረን። አቤቱ ከኃጢአታችን አንጻን..."
  }
};

export function PrayerDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const prayer = MOCK_PRAYERS[id || ""];

  const isOffline = useOffline();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (prayer) {
      checkDownloadStatus();
    }
  }, [prayer]);

  const checkDownloadStatus = async () => {
    if (!id) return;
    try {
      const cache = await caches.open("prayers-cache");
      const match = await cache.match(`/api/prayers/${id}`);
      setIsDownloaded(!!match);
    } catch (e) {
      console.error("Cache check failed", e);
    }
  };

  const handleDownload = async () => {
    if (!id || !prayer) return;
    setIsDownloading(true);
    try {
      const cache = await caches.open("prayers-cache");
      // Since we're using mocks, we'll cache a fake response
      const response = new Response(JSON.stringify(prayer), {
        headers: { "Content-Type": "application/json" }
      });
      await cache.put(`/api/prayers/${id}`, response);
      setIsDownloaded(true);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const isAmharic = i18n.language === "am";

  if (!prayer) {
    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold">Prayer not found</h2>
        <Link href="/prayers" className="text-primary mt-4 block underline">Back to prayers</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-[#FCF8F1] dark:bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#FCF8F1]/80 dark:bg-background/80 backdrop-blur-lg border-b border-border/40 px-4 h-14 flex items-center justify-between">
        <Link href="/prayers">
          <button className="p-2 -ml-2 text-foreground/70 hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </button>
        </Link>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setFontSize(f => f === "sm" ? "md" : f === "md" ? "lg" : "sm")}
            className="p-2 text-foreground/70 hover:text-primary transition-colors"
            title="Adjust Font Size"
          >
            <Type className="h-5 w-5" />
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading || isDownloaded || isOffline}
            className={cn(
              "p-2 transition-colors",
              isDownloaded ? "text-primary" : "text-foreground/70 hover:text-primary"
            )}
            title={isDownloaded ? "Available Offline" : "Download for Offline"}
          >
            {isDownloading ? (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            ) : isDownloaded ? (
              <Check className="h-5 w-5" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </button>
          <button className="p-2 text-foreground/70 hover:text-rose-500 transition-colors">
            <Heart className="h-5 w-5" />
          </button>
          <button className="p-2 text-foreground/70 hover:text-primary transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Prayer Content */}
      <div className="max-w-2xl mx-auto p-6 md:p-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            {isAmharic ? prayer.amTitle : prayer.title}
          </h1>
          <div className="w-16 h-0.5 bg-primary/30 mx-auto" />
        </div>

        <div className={cn(
          "font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap transition-all duration-300",
          fontSize === "sm" && "text-base",
          fontSize === "md" && "text-xl",
          fontSize === "lg" && "text-2xl"
        )}>
          {isAmharic ? prayer.amContent : prayer.content}
        </div>

        {/* Footer decoration */}
        <div className="mt-20 text-center opacity-10">
          <div className="inline-block border-2 border-foreground p-3 rounded-sm rotate-45">
            <div className="w-2 h-2 bg-foreground" />
          </div>
        </div>
      </div>

      {/* Floating Action Button for Focus Mode */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <Maximize2 className="h-6 w-6" />
      </button>
    </div>
  );
}
