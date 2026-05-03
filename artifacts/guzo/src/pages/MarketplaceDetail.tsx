import {
  useGetMarketplaceItem,
  getGetMarketplaceItemQueryKey,
  useListMarketplaceItems,
  getListMarketplaceItemsQueryKey,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  MapPin,
  User as Seller,
  CheckCircle2,
  Package,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Tag,
  Award,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { cn } from "@/lib/utils";
import { EngagementSection } from "@/components/engagement/EngagementSection";
import { ChatOverlay } from "@/components/market/ChatOverlay";
import { SeoHead } from "@/components/seo/SeoHead";
import { useState } from "react";

export function MarketplaceDetail() {
  const { t } = useTranslation();
  const [, params] = useRoute("/marketplace/:id");
  const id = params?.id || "";
  const { isAuthed, openLogin } = useAuth();
  const wishlist = useWishlist();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { data: item, isLoading } = useGetMarketplaceItem(id, {
    query: { enabled: !!id, queryKey: getGetMarketplaceItemQueryKey(id) },
  });

  const { data: allItems } = useListMarketplaceItems(
    {},
    { query: { queryKey: getListMarketplaceItemsQueryKey({}) } },
  );

  const related = useMemo(() => {
    if (!item || !allItems) return [];
    return (Array.isArray(allItems) ? allItems : [])
      .filter((i) => i.id !== item.id && i.category === item.category)
      .slice(0, 6);
  }, [item, allItems]);

  if (isLoading)
    return (
      <div className="p-4 space-y-4">
        <div className="w-full aspect-square bg-muted animate-pulse rounded-2xl" />
        <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-full" />
      </div>
    );
  if (!item)
    return <div className="p-8 text-center text-muted-foreground">{t("market.noItems")}</div>;

  const saved = wishlist.has(item.id);

  const onContact = () => {
    if (!isAuthed) {
      openLogin(t("auth.loginRequired"));
      return;
    }
    setIsChatOpen(true);
  };

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: item.title, url }); } catch { /* */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* */ }
    }
  };

  return (
    <div className="pb-32 bg-background min-h-full">
      <SeoHead
        title={item.title}
        description={item.description?.slice(0, 160) || `${item.category} • ${item.condition ?? ""}`.trim()}
        image={item.imageUrl}
        type="product"
      />
      {/* Image hero */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-muted/40 to-card">
        <img
          src={item.imageUrl || "https://placehold.co/800x800"}
          alt={item.title}
          className="w-full h-full object-contain p-6"
        />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background/95 rounded-full backdrop-blur-md shadow-sm border border-border/60"
              onClick={onShare}
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "bg-background/80 hover:bg-background/95 rounded-full backdrop-blur-md shadow-sm border border-border/60",
                saved && "text-primary",
              )}
              onClick={() => wishlist.toggle(item.id)}
              data-testid="button-wishlist"
              aria-label={saved ? t("market.removeFromWishlist") : t("market.addToWishlist")}
            >
              <Heart className={cn("h-5 w-5", saved && "fill-current")} />
            </Button>
          </div>
        </div>

        {item.isFeatured && (
          <div className="absolute bottom-3 left-3">
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded-full text-primary-foreground shadow"
              style={{ background: "var(--gold-gradient)" }}
            >
              <Sparkles className="h-3 w-3" /> {t("common.featured")}
            </span>
          </div>
        )}
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-5">
        {/* Title + price card */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-md p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3" /> {item.category}
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground leading-tight">
                {item.title}
              </h1>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-primary tabular-nums">
                {Number(item.price).toFixed(0)}
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {item.currency}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.condition && (
              <Chip icon={<Award className="h-3 w-3" />} label={item.condition} />
            )}
            {item.inStock ? (
              <Chip
                icon={<CheckCircle2 className="h-3 w-3" />}
                label={t("market.inStock")}
                variant="success"
              />
            ) : (
              <Chip
                icon={<Package className="h-3 w-3" />}
                label={t("market.outOfStock")}
                variant="danger"
              />
            )}
            {item.sellerLocation && (
              <Chip icon={<MapPin className="h-3 w-3" />} label={item.sellerLocation} />
            )}
          </div>
        </div>

        {/* Description */}
        <Section title={t("market.description", { defaultValue: "About this item" })}>
          <div className="prose prose-sm dark:prose-invert prose-p:text-foreground/85 prose-p:leading-relaxed max-w-none">
            {item.description.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Section>

        {/* Seller card */}
        <Section title={t("market.seller")}>
          <Link href={`/market/seller/1`}>
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Seller className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.sellerName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="h-3 w-3" /> {item.sellerLocation || "—"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onContact();
                  }}
                  data-testid="button-message-seller"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  {t("market.message", { defaultValue: "Message" })}
                </Button>
              </div>
            </div>
          </Link>
        </Section>

        {/* Shipping & care */}
        <Section title={t("market.shippingCare", { defaultValue: "Shipping & care" })}>
          <div className="grid grid-cols-1 gap-3">
            <InfoCard
              icon={<Truck className="h-5 w-5" />}
              title={t("market.shipping", { defaultValue: "Shipping" })}
              body="Items ship from the seller's location, typically within 3 business days. International orders use tracked airmail (10–18 business days). All packages include moisture-resistant wrapping appropriate for the item type."
            />
            <InfoCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title={t("market.authenticity", { defaultValue: "Authenticity" })}
              body="Every item on Guzo is reviewed by our team for authenticity and ethical sourcing. Liturgical items are blessed only at the buyer's local church — Guzo does not sell consecrated tabotat or holy chrism."
            />
            <InfoCard
              icon={<Award className="h-5 w-5" />}
              title={t("market.care", { defaultValue: "Care instructions" })}
              body="Hand-painted icons should be kept away from direct sunlight and humidity. Wood items occasionally benefit from a light wipe with beeswax polish. Brass crosses naturally develop a warm patina; clean only with a soft cloth."
            />
          </div>
        </Section>

        {/* Related items */}
        {related.length > 0 && (
          <Section title={t("market.related", { defaultValue: "More from this category" })}>
            <div className="flex gap-3 overflow-x-auto pb-2 -mr-5 pr-5 scrollbar-hide">
              {related.map((r) => (
                <Link key={r.id} href={`/marketplace/${r.id}`}>
                  <div
                    className="w-36 shrink-0 rounded-2xl overflow-hidden bg-card border border-border/60 hover-elevate cursor-pointer"
                    data-testid={`card-related-item-${r.id}`}
                  >
                    <div className="aspect-square bg-muted/40">
                      <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium line-clamp-2 leading-tight">
                        {r.title}
                      </div>
                      <div className="text-xs font-bold text-primary mt-1 tabular-nums">
                        {Number(r.price).toFixed(0)}{" "}
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {r.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border/60 md:absolute md:bottom-0 z-30">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full h-12 px-5 shadow-sm"
            onClick={() => wishlist.toggle(item.id)}
            data-testid="button-wishlist-bottom"
          >
            <Heart className={cn("h-5 w-5", saved && "fill-current text-primary")} />
          </Button>
          <Button
            className="flex-1 h-12 rounded-full font-semibold shadow-md text-base"
            onClick={onContact}
            disabled={!item.inStock}
            data-testid="button-contact-seller"
            style={item.inStock ? { background: "var(--gold-gradient)" } : undefined}
          >
            {item.inStock ? t("market.contactSeller") : t("market.outOfStock")}
          </Button>
        </div>
      </div>

      <EngagementSection targetType="marketplace" targetId={id} />
      
      {item && (
        <ChatOverlay 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          item={{
            id: item.id.toString(),
            title: item.title,
            price: item.price,
            currency: item.currency,
            sellerName: item.sellerName,
            imageUrl: item.imageUrl
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary mb-3">
        {title}
      </div>
      {children}
    </section>
  );
}

function Chip({
  icon,
  label,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "success" | "danger";
}) {
  const cls =
    variant === "success"
      ? "bg-green-500/10 text-green-700 dark:text-green-300"
      : variant === "danger"
        ? "bg-red-500/10 text-red-700 dark:text-red-300"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium",
        cls,
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-3 shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground mb-1">{title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
