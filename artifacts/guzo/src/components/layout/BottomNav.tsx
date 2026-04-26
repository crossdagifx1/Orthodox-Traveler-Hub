import { Link, useLocation } from "wouter";
import { Home, Map as MapIcon, Music, ShoppingBag, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/destinations", icon: MapPin, label: "Holy Sites" },
  { path: "/map", icon: MapIcon, label: "Map" },
  { path: "/marketplace", icon: ShoppingBag, label: "Market" },
  { path: "/mezmurs", icon: Music, label: "Mezmurs" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="sticky bottom-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map((tab) => {
          const isActive = location === tab.path || (tab.path !== "/" && location.startsWith(tab.path));
          const Icon = tab.icon;
          
          return (
            <Link key={tab.path} href={tab.path}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-200 active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-1 rounded-full transition-all duration-300",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive ? "opacity-100 font-semibold" : "opacity-70"
                )}>
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
