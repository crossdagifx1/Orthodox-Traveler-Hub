import { useTranslation } from "react-i18next";
import { Link, useParams } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  Star, 
  Calendar, 
  Package,
  Heart,
  ExternalLink,
  ShieldCheck,
  Award
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useListMarketplaceItems } from "@workspace/api-client-react";

export function SellerStore() {
  const { id } = useParams();
  const { t } = useTranslation();
  
  // Mock Seller Data
  const seller = {
    name: "Abba Tekle",
    location: "Addis Ababa, Ethiopia",
    memberSince: "May 2023",
    verification: "Gold",
    rating: 4.9,
    reviews: 124,
    bio: "Artisan specializing in hand-carved processional crosses and traditional incense blends. Each item is made with prayer and high-quality materials.",
    avatar: "https://images.unsplash.com/photo-1544126592-807daa2b567b?auto=format&fit=crop&q=80&w=200"
  };

  const { data: items, isLoading } = useListMarketplaceItems();

  const sellerItems = useMemo(() => {
    return (Array.isArray(items) ? items : []).slice(0, 8); // Mocking filtered items for this seller
  }, [items]);

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Hero Header */}
      <div className="relative h-40 bg-primary/10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <Link href="/marketplace">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 rounded-full bg-background/50 backdrop-blur-md">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Seller Profile Card */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden shadow-lg mx-auto">
              <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 bg-amber-500 text-white p-1.5 rounded-full border-4 border-card shadow-md">
              <Award className="h-4 w-4" />
            </div>
          </div>

          <h1 className="text-2xl font-serif font-bold text-foreground mb-1 flex items-center justify-center gap-2">
            {seller.name}
            <CheckCircle2 className="h-5 w-5 text-primary fill-primary/10" />
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {seller.location}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Since {seller.memberSince}
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-6 border-y border-border/40 py-4">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{seller.rating}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Rating</div>
            </div>
            <div className="w-px bg-border/40" />
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{seller.reviews}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reviews</div>
            </div>
            <div className="w-px bg-border/40" />
            <div className="text-center">
              <div className="text-lg font-bold text-foreground text-amber-600">{seller.verification}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Level</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed italic px-4">
            "{seller.bio}"
          </p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-3 p-4 mt-4">
        <div className="flex items-center gap-3 bg-secondary/5 rounded-2xl p-3 border border-secondary/10">
          <ShieldCheck className="h-5 w-5 text-secondary" />
          <div className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-tight">
            Identity Verified
          </div>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 rounded-2xl p-3 border border-primary/10">
          <Star className="h-5 w-5 text-primary" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest leading-tight">
            Top-Rated Seller
          </div>
        </div>
      </div>

      {/* Seller Listings */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-primary flex items-center gap-2">
            <Package className="h-4 w-4" /> Active Listings ({sellerItems.length})
          </h2>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1">
            Filter <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
             [1, 2, 4, 4].map(i => <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />)
          ) : (
            sellerItems.map(item => (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <Card className="overflow-hidden border-border/60 shadow-sm rounded-2xl group cursor-pointer hover-elevate">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-colors">
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{item.category}</div>
                    <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-2">{item.title}</h3>
                    <div className="text-base font-bold text-primary">{item.price} <span className="text-[10px] text-muted-foreground">{item.currency}</span></div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
