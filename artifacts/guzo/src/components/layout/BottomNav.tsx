import { Link, useLocation } from "wouter";
import { Home, Map as MapIcon, GraduationCap, ShoppingBag, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/", icon: Home, key: "home" as const },
  { path: "/destinations", icon: MapPin, key: "destinations" as const },
  { path: "/learn", icon: GraduationCap, key: "learn" as const },
  { path: "/map", icon: MapIcon, key: "map" as const },
  { path: "/marketplace", icon: ShoppingBag, key: "market" as const },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map((tab) => {
          const isActive =
            location === tab.path || (tab.path !== "/" && location.startsWith(tab.path));
          const Icon = tab.icon;

          return (
            <Link key={tab.path} href={tab.path}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-200 active:scale-95 cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                data-testid={`nav-${tab.key}`}
              >
                <div
                  className={cn(
                    "p-1 rounded-full transition-all duration-300",
                    isActive && "bg-primary/10",
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", isActive && "fill-primary/20")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    isActive ? "opacity-100 font-semibold" : "opacity-70",
                  )}
                >
                  {t(`nav.${tab.key}`)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
