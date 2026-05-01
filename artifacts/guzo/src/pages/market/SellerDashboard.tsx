import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  TrendingUp, 
  MessageSquare, 
  Eye, 
  Package, 
  Zap, 
  MoreVertical, 
  Edit3, 
  CheckCircle, 
  Trash2,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useListMarketplaceItems } from "@workspace/api-client-react";

export function SellerDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"active" | "sold" | "archived">("active");

  const { data: items, isLoading } = useListMarketplaceItems();
  
  // Mock Stats
  const stats = [
    { label: "Total Views", value: "2.4k", icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Chats", value: "18", icon: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
    { label: "Earnings", value: "15.2k", icon: DollarSign, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Active Ads", value: "8", icon: Package, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  const myItems = (Array.isArray(items) ? items : []).slice(0, 5);

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Header */}
      <header className="px-6 pt-8 pb-6 bg-card border-b border-border/60">
        <div className="flex items-center justify-between mb-4">
          <Link href="/marketplace">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="rounded-full font-bold text-xs">
            Shop Settings
          </Button>
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
          Seller Dashboard
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-green-500" /> 
          Your sales are up 12% this week
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {stats.map((s, idx) => (
          <Card key={idx} className="p-4 border-border/60 shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Boost Call-to-action */}
      <div className="m-4 p-5 rounded-3xl bg-amber-500 text-white relative overflow-hidden shadow-lg shadow-amber-200">
        <div className="relative z-10 pr-16">
          <h3 className="font-bold text-lg mb-1">Boost Your Sales!</h3>
          <p className="text-xs opacity-90 leading-relaxed">
            Featured ads get 5x more views. Reach more pilgrims today.
          </p>
          <Button className="mt-4 bg-white text-amber-600 hover:bg-white/90 font-bold rounded-full h-9 px-6 text-xs">
            Start Boosting
          </Button>
        </div>
        <Zap className="absolute -right-4 -bottom-4 h-32 w-32 opacity-20 rotate-12" />
      </div>

      {/* My Listings */}
      <div className="px-4 mt-8">
        <div className="flex items-center gap-4 mb-6 border-b border-border/40 pb-2 overflow-x-auto scrollbar-hide">
          {(["active", "sold", "archived"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-xs font-bold uppercase tracking-widest pb-2 transition-all whitespace-nowrap px-1",
                activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {isLoading ? (
             <div className="h-40 bg-muted animate-pulse rounded-2xl" />
          ) : (
            myItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-3 border-border/60 shadow-sm flex gap-4 overflow-hidden relative group">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-bold text-foreground text-sm truncate mb-1">{item.title}</h4>
                    <div className="text-xs font-bold text-primary mb-2">
                      {item.price} <span className="text-[9px] text-muted-foreground">{item.currency}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-bold">
                        <Eye className="h-2.5 w-2.5" /> 421 views
                      </span>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-bold">
                        <MessageSquare className="h-2.5 w-2.5" /> 12 chats
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-1">
                       <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-500 bg-blue-50">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-green-500 bg-green-50">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-rose-500 bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
