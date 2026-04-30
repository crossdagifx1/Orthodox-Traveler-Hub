import {
  useListMarketplaceItems,
  getListMarketplaceItemsQueryKey,
  useListFeaturedItems,
} from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search, Plus, Heart, Sparkles } from "lucide-react";
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

const CATEGORIES = ["all", "Crosses", "Garments", "Icons", "Incense", "Books"] as const;
type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export function Marketplace() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
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
        <div className="relative z-10 w-full flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary leading-tight">
              {t("market.title")}
            </h1>
            <p className="text-muted-foreground text-sm">{t("market.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {wishlist.count > 0 && (
              <span
                className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-1 rounded-full"
                data-testid="badge-wishlist-count"
              >
                <Heart className="inline h-3 w-3 mr-1 fill-current" />
                {wishlist.count}
              </span>
            )}
            <Button
              size="sm"
              className="rounded-full shadow-md"
              onClick={onSell}
              data-testid="button-sell-item"
            >
              <Plus className="h-4 w-4 mr-1" /> {t("market.sellItem")}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 relative z-20">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("market.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60 rounded-full shadow-sm"
            data-testid="input-search-market"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              data-testid={`chip-cat-${cat}`}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors hover-elevate active-elevate-2",
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/60 text-muted-foreground",
              )}
            >
              {cat === "all"
                ? t("market.categories.all")
                : t(`market.categories.${cat}`, { defaultValue: cat })}
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
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((item) => {
              const saved = wishlist.has(item.id);
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      wishlist.toggle(item.id);
                    }}
                    aria-label={saved ? t("market.removeFromWishlist") : t("market.addToWishlist")}
                    data-testid={`button-wishlist-${item.id}`}
                    className={cn(
                      "absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/85 backdrop-blur border border-border/60 flex items-center justify-center hover-elevate",
                      saved && "text-primary",
                    )}
                  >
                    <Heart className={cn("h-4 w-4", saved && "fill-current")} />
                  </button>
                  <Link href={`/marketplace/${item.id}`}>
                    <Card
                      className="overflow-hidden cursor-pointer hover-elevate transition-transform active:scale-[0.97] border border-border/60 shadow-sm rounded-2xl group"
                      data-testid={`card-market-${item.id}`}
                    >
                      <div className="aspect-square bg-muted/60 overflow-hidden relative">
                        <img
                          src={item.imageUrl || "https://placehold.co/400"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-background/65 flex items-center justify-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                              {t("market.outOfStock")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {item.category}
                        </div>
                        <div className="text-sm font-medium text-foreground line-clamp-2 leading-tight my-1 min-h-[2.5em]">
                          {item.title}
                        </div>
                        <div className="text-base font-bold text-primary tabular-nums">
                          {item.price}{" "}
                          <span className="text-[10px] text-muted-foreground">
                            {item.currency}
                          </span>
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
