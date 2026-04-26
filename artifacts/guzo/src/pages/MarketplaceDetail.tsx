import { useGetMarketplaceItem, getGetMarketplaceItemQueryKey, useGetCurrentUser } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { ArrowLeft, MapPin, User as Seller, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { format } from "date-fns";

export function MarketplaceDetail() {
  const [, params] = useRoute("/marketplace/:id");
  const id = params?.id || "";
  const { data: user } = useGetCurrentUser();
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: item, isLoading } = useGetMarketplaceItem(id, {
    query: { enabled: !!id, queryKey: getGetMarketplaceItemQueryKey(id) }
  });

  if (isLoading) return <div className="p-4 space-y-4"><div className="w-full aspect-square bg-muted animate-pulse rounded-2xl" /></div>;
  if (!item) return <div className="p-8 text-center">Item not found</div>;

  return (
    <div className="pb-24 bg-background min-h-full">
      <div className="relative w-full aspect-square bg-muted/20">
        <img src={item.imageUrl || "https://placehold.co/800x800"} alt={item.title} className="w-full h-full object-contain p-4" />
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-primary bg-background/50 hover:bg-background/80 rounded-full backdrop-blur-md shadow-sm border border-border/50" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-serif font-bold text-foreground leading-tight">{item.title}</h1>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">{item.price}</div>
            <div className="text-xs font-medium text-muted-foreground uppercase">{item.currency}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.category}</span>
          <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">{item.condition}</span>
          {item.inStock ? (
            <span className="bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> In Stock
            </span>
          ) : (
            <span className="bg-red-500/10 text-red-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Package className="h-3 w-3" /> Out of Stock
            </span>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
          <p>{item.description}</p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-3 font-serif uppercase tracking-widest opacity-80">Seller Info</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Seller className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-foreground">{item.sellerName}</div>
              <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                <MapPin className="h-3 w-3 mr-1" /> {item.sellerLocation || "Location unknown"}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50 md:absolute md:bottom-0">
          <Button 
            className="w-full h-12 rounded-full font-medium text-base shadow-md"
            onClick={() => user?.user ? window.open(`mailto:seller@example.com?subject=Guzo Marketplace: ${item.title}`) : setLoginOpen(true)}
            disabled={!item.inStock}
          >
            {item.inStock ? "Contact Seller" : "Currently Unavailable"}
          </Button>
        </div>
      </div>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
