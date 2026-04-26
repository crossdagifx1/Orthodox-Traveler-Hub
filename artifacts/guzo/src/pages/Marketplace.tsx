import { useListMarketplaceItems, getListMarketplaceItemsQueryKey, useGetCurrentUser } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["All", "Crosses", "Garments", "Icons", "Incense", "Books"];

export function Marketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { data: items, isLoading } = useListMarketplaceItems(
    { q: search || undefined, category: category === "All" ? undefined : category },
    { query: { queryKey: getListMarketplaceItemsQueryKey({ q: search || undefined, category: category === "All" ? undefined : category }) } }
  );

  const { data: user } = useGetCurrentUser();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-full bg-background pb-20">
      <div className="relative h-48 w-full flex items-end p-4">
        <img src="/images/market-bg.png" alt="Market" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="relative z-10 w-full flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Marketplace</h1>
            <p className="text-muted-foreground text-sm">Authentic Orthodox items</p>
          </div>
          {user?.user && (
            <Button size="sm" className="rounded-full shadow-md" onClick={() => setLocation("/marketplace/new")}>
              <Plus className="h-4 w-4 mr-1" /> Sell Item
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 -mt-2 relative z-20">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50 rounded-full shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : items?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items?.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <Card className="overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-95 border-border/50 shadow-sm rounded-2xl group flex flex-col h-full bg-card">
                  <div className="aspect-square relative p-2 bg-muted/20">
                    <img 
                      src={item.imageUrl || "https://placehold.co/400x400"} 
                      alt={item.title} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-serif font-bold text-foreground text-sm line-clamp-2 leading-snug mb-1">{item.title}</h3>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="font-bold text-primary">{item.price} {item.currency}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
