import { useGetCurrentUser, useLogout } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { LogOut, MapPin, Church, ShoppingBag, Music, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminDashboard() {
  const { data: user, isLoading } = useGetCurrentUser();
  const [, setLocation] = useLocation();
  const logout = useLogout();

  if (isLoading) return null;
  
  if (!user?.user || (user.user.role !== "admin" && user.user.role !== "superadmin")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h1 className="text-2xl font-serif font-bold text-primary mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You need administrator privileges to view this area.</p>
        <Link href="/">
          <Button variant="outline" className="rounded-full">Return Home</Button>
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
        window.location.reload();
      }
    });
  };

  const sections = [
    { title: "Destinations", icon: MapPin, path: "/admin/destinations", desc: "Manage holy sites & regions" },
    { title: "Churches", icon: Church, path: "/admin/churches", desc: "Manage global churches" },
    { title: "Marketplace", icon: ShoppingBag, path: "/admin/marketplace", desc: "Moderate listings" },
    { title: "Mezmurs", icon: Music, path: "/admin/mezmurs", desc: "Manage audio & lyrics" },
    { title: "News", icon: FileText, path: "/admin/news", desc: "Publish articles & teachings" },
  ];

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user.user.name || user.user.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-destructive">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.path} href={section.path}>
              <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 cursor-pointer hover-elevate transition-transform active:scale-[0.98]">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-lg">{section.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{section.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
