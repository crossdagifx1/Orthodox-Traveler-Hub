import { Link, useLocation } from "wouter";
import { User, LogIn, Menu } from "lucide-react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LoginDialog } from "../auth/LoginDialog";

export function TopBar() {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetCurrentUser();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
      <Link href="/">
        <div className="font-serif text-xl font-bold text-primary flex items-center gap-2">
          <span>ጉዞ</span>
          <span className="text-sm font-sans tracking-widest uppercase text-muted-foreground">Guzo</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {!isLoading && (
          user?.user ? (
            <Link href={user.user.role === "admin" || user.user.role === "superadmin" ? "/admin" : "/"}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLoginOpen(true)}>
              <LogIn className="h-5 w-5" />
            </Button>
          )
        )}
      </div>
      
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
