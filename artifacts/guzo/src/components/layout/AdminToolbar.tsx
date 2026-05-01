import { useLocation, Link } from "wouter";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Shield, 
  Settings, 
  Map as MapIcon, 
  Music, 
  ShoppingBag, 
  Newspaper, 
  MapPin,
  ScrollText,
  Activity,
  Users,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * AdminToolbar: A floating toolbar that appears only for admins/moderators.
 * Provides quick links to the admin version of the current feature.
 */
export function AdminToolbar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { isAdmin, isStaff, hasRoleAtLeast } = useAuth();

  // Only show if staff
  if (!isStaff) return null;

  // Determine relevant admin link based on current location
  const getRelevantAdminPath = () => {
    if (location.startsWith("/destinations")) return "/admin/destinations";
    if (location.startsWith("/map")) return "/admin/churches"; // Map is powered by churches + destinations
    if (location.startsWith("/marketplace")) return "/admin/marketplace";
    if (location.startsWith("/mezmurs")) return "/admin/mezmurs";
    if (location.startsWith("/news")) return "/admin/news";
    if (location.startsWith("/learn")) return "/admin/qa";
    if (location.startsWith("/me") || location.startsWith("/u/")) return "/admin/users";
    return "/admin";
  };

  const adminPath = getRelevantAdminPath();
  const isCurrentlyInAdmin = location.startsWith("/admin");

  // If already in admin, maybe show a "View Site" or "Live Logs"
  if (isCurrentlyInAdmin) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1.5 p-1.5 bg-black/80 backdrop-blur-md rounded-full border border-white/20 shadow-2xl ring-1 ring-white/10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="rounded-full h-8 text-[10px] font-bold text-white hover:bg-white/10 uppercase tracking-widest gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Live Site
          </Button>
        </Link>
        <div className="w-px h-4 bg-white/20 mx-0.5" />
        <Link href="/admin/audit">
          <Button variant="ghost" size="sm" className={cn(
            "rounded-full h-8 text-[10px] font-bold uppercase tracking-widest gap-1.5",
            location === "/admin/audit" ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/10"
          )}>
            <ScrollText className="h-3.5 w-3.5" />
            System Logs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1.5 p-1.5 bg-primary/90 backdrop-blur-md rounded-full border border-primary-foreground/20 shadow-2xl ring-1 ring-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-2.5 py-1 flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-primary-foreground" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-foreground/90">Admin</span>
      </div>
      
      <div className="w-px h-4 bg-primary-foreground/20 mx-0.5" />

      <Link href={adminPath}>
        <Button size="sm" className="bg-white text-primary hover:bg-white/90 rounded-full h-8 px-3 text-[10px] font-bold uppercase tracking-widest gap-1.5 shadow-sm">
          {adminPath === "/admin/destinations" && <MapPin className="h-3.5 w-3.5" />}
          {adminPath === "/admin/churches" && <MapIcon className="h-3.5 w-3.5" />}
          {adminPath === "/admin/marketplace" && <ShoppingBag className="h-3.5 w-3.5" />}
          {adminPath === "/admin/mezmurs" && <Music className="h-3.5 w-3.5" />}
          {adminPath === "/admin/news" && <Newspaper className="h-3.5 w-3.5" />}
          {adminPath === "/admin/qa" && <GraduationCap className="h-3.5 w-3.5" />}
          {adminPath === "/admin/users" && <Users className="h-3.5 w-3.5" />}
          {adminPath === "/admin" && <Settings className="h-3.5 w-3.5" />}
          Manage {adminPath.split("/").pop()}
        </Button>
      </Link>

      <div className="w-px h-4 bg-primary-foreground/20 mx-0.5" />

      <Link href="/admin/audit">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary-foreground hover:bg-white/10" title="System Logs">
          <ScrollText className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
