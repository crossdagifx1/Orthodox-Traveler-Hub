import { useGetCurrentUser } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { data, isLoading } = useGetCurrentUser();
  if (isLoading) return null;
  const role = data?.user?.role;
  if (role !== "admin" && role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h1 className="text-2xl font-serif font-bold text-primary mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You need administrator privileges to view this area.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-full">
            Return Home
          </Button>
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
