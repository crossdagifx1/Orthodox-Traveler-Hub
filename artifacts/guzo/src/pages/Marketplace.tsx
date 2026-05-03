import {
  useListMarketplaceItems,
  getListMarketplaceItemsQueryKey,
  useListFeaturedItems,
} from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search, Plus, Heart, Sparkles, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/AuthProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Heart,
  Sparkles,
  CheckCircle,
  MapPin,
  Filter,
  LayoutGrid,
  List,
  Zap,
  TrendingUp
} from "lucide-react";

const CATEGORIES = [
  "all",
  "Ecclesiastical",
  "Clothing",
  "Icons",
  "Incense",
  "Books",
  "Jewelry",
  "Handicrafts"
] as const;
type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "views";

export function Marketplace() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [location, setLocation] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("featured");
  const { isAuthed, openLogin } = useAuth();
  const wishlist = useWishlist();
  const [, setLocation] = useLocation();

  const { data: items, isLoading } = useListMarketplaceItems(
    {
      q: search || undefined,
      category: category === "all" ? undefined : category,
    },
    {
      query: {
        queryKey: getListMarketplaceItemsQueryKey({
          q: search || undefined,
          category: category === "all" ? undefined : category,
        }),
      },
    },
  );

  const { data: featured } = useListFeaturedItems();

  const sorted = useMemo(() => {
    const arr = [...(Array.isArray(items) ? items : [])];
    switch (sort) {
      case "price-asc":
        arr.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        arr.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "newest":
        arr.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        break;
      case "featured":
      default:
        arr.sort((a, b) => Number(b.isFeatured ?? 0) - Number(a.isFeatured ?? 0));
    }
    return arr;
  }, [items, sort]);

  const onSell = () => {
    if (!isAuthed) {
      openLogin(t("auth.loginRequired"));
      return;
    }
    setLocation("/marketplace/new");
  };

  return (
    <div className="min-h-full bg-background pb-24">
      <div className="relative h-44 w-full flex items-end p-4">
        <img
          src="/images/market-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" />
        <div className="relative z-10 w-full">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-serif font-bold text-primary leading-tight">
              {t("market.title")}
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{t("market.subtitle")}</p>
          </div>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {wishlist.count > 0 && (
              <span
                className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-1 rounded-full backdrop-blur-sm"
                data-testid="badge-wishlist-count"
              >
                <Heart className="inline h-3 w-3 mr-1 fill-current" />
                {wishlist.count}
              </span>
            )}
            <Button
              size="sm"
              className="rounded-full shadow-md h-8 text-xs px-4"
              onClick={onSell}
              data-testid="button-sell-item"
            >
              <Plus className="h-3 w-3 mr-1" /> {t("market.sellItem")}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 relative z-20">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("market.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/60 rounded-full shadow-sm"
              data-testid="input-search-market"
            />
          </div>
          <div className="relative w-28">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="City"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-9 bg-card border-border/60 rounded-full shadow-sm text-xs"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-card border border-border/60 shrink-0"
            onClick={() => setLayout(l => l === "grid" ? "list" : "grid")}
          >
            {layout === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/60 text-muted-foreground",
              )}
            >
              {category === cat && <CheckCircle className="h-3 w-3" />}
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {category === "all" && (featured?.length ?? 0) > 0 && (
          <section className="mb-5 -mx-4 px-4">
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-2">
              <Sparkles className="h-3 w-3" />
              {t("common.featured")}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
              {(Array.isArray(featured) ? featured : []).slice(0, 8).map((it) => (
                <Link key={it.id} href={`/marketplace/${it.id}`}>
                  <Card
                    className="w-[140px] shrink-0 rounded-2xl overflow-hidden cursor-pointer hover-elevate group border border-border/60 shadow-sm"
                    data-testid={`card-featured-market-${it.id}`}
                  >
                    <div className="aspect-square bg-muted/60 overflow-hidden">
                      <img
                        src={it.imageUrl || "https://placehold.co/300"}
                        alt={it.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {it.category}
                      </div>
                      <div className="text-xs font-medium text-foreground line-clamp-1">
                        {it.title}
                      </div>
                      <div className="text-sm font-bold text-primary mt-0.5">
                        {it.price}{" "}
                        <span className="text-[9px] text-muted-foreground">{it.currency}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {sorted.length} {sorted.length === 1 ? "" : ""}
          </span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger
              className="h-8 w-[160px] rounded-full text-xs border-border/60 bg-card"
              data-testid="select-sort"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">{t("market.sortFeatured")}</SelectItem>
              <SelectItem value="newest">{t("market.sortNewest")}</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="price-asc">{t("market.sortPriceLow")}</SelectItem>
              <SelectItem value="price-desc">{t("market.sortPriceHigh")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <img
              src="/images/empty-incense.png"
              alt=""
              className="w-28 h-28 mx-auto opacity-50 mb-3 rounded-xl mix-blend-multiply"
            />
            <p className="font-serif">{t("market.noItems")}</p>
          </div>
        ) : (
          <div className={cn(
            layout === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"
          )}>
            {sorted.map((item) => {
              const saved = wishlist.has(item.id);
              const isBoosted = (item as any).isBoosted;
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      wishlist.toggle(item.id);
                    }}
                    className={cn(
                      "absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/85 backdrop-blur border border-border/60 flex items-center justify-center hover-elevate shadow-sm",
                      saved && "text-primary",
                    )}
                  >
                    <Heart className={cn("h-4 w-4", saved && "fill-current")} />
                  </button>

                  <Link href={`/marketplace/${item.id}`}>
                    <Card
                      className={cn(
                        "overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-[0.97] border border-border/60 shadow-sm rounded-2xl group",
                        layout === "list" && "flex h-32",
                        isBoosted && "border-amber-500/30 bg-amber-50/10 shadow-amber-100/20"
                      )}
                    >
                      <div className={cn(
                        "bg-muted/60 overflow-hidden relative shrink-0",
                        layout === "grid" ? "aspect-square" : "w-32 h-full"
                      )}>
                        <img
                          src={item.imageUrl || "https://placehold.co/400"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {isBoosted && (
                          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md">
                            <Zap className="h-2 w-2 fill-current" /> TOP
                          </div>
                        )}
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-background/65 flex items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                              SOLD
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={cn("p-3 flex flex-col justify-between", layout === "list" && "flex-1 min-w-0")}>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">
                              {item.category}
                            </div>
                            {(item as any).sellerIsVerified && (
                              <CheckCircle className="h-3 w-3 text-primary fill-primary/10" />
                            )}
                          </div>
                          <div className={cn(
                            "text-sm font-medium text-foreground line-clamp-2 leading-tight mb-1",
                            layout === "grid" && "min-h-[2.5em]"
                          )}>
                            {item.title}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <div className="text-base font-bold text-primary tabular-nums">
                            {item.price}{" "}
                            <span className="text-[10px] text-muted-foreground">
                              {item.currency}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-[9px] text-muted-foreground italic truncate max-w-[80px]">
                              {item.sellerName}
                            </div>
                            <div className="text-[8px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-2 w-2" /> {item.sellerLocation?.split(",")[0]}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
