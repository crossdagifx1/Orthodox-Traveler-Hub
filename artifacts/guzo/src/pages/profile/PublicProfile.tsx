import { Link, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Award, Flame, Star } from "lucide-react";
import {
  getGetPublicProfileQueryKey,
  useGetPublicProfile,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function PublicProfile() {
  const { t } = useTranslation();
  const [, params] = useRoute("/u/:id");
  const id = params?.id || "";

  const { data: profile, isLoading, error } = useGetPublicProfile(id, {
    query: { enabled: !!id, queryKey: getGetPublicProfileQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          {t("profile.notFoundOrPrivate", {
            defaultValue: "This profile is private or does not exist.",
          })}
        </p>
        <Link href="/">
          <Button variant="ghost" data-testid="button-go-home">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const initials =
    (profile.name || "?")
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="pb-24">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <Link href="/">
          <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
          </Button>
        </Link>
      </header>

      <section className="px-4 pt-6 flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-3">
          <AvatarImage src={profile.avatarUrl} alt={profile.name} />
          <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-bold">{profile.name}</h1>
        {profile.bio && (
          <p className="text-sm text-foreground/80 mt-3 max-w-md">{profile.bio}</p>
        )}
        <div className="mt-2">
          <Badge variant="secondary" className="text-[10px] uppercase">
            {profile.role}
          </Badge>
        </div>
      </section>

      <section className="px-4 mt-6 grid grid-cols-3 gap-2">
        <Card className="p-3 flex flex-col items-center">
          <Flame className="h-4 w-4 text-primary mb-1" />
          <div className="text-lg font-bold leading-none">
            {profile.stats?.currentStreak ?? 0}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            {t("profile.streak", { defaultValue: "Streak" })}
          </div>
        </Card>
        <Card className="p-3 flex flex-col items-center">
          <Star className="h-4 w-4 text-primary mb-1" />
          <div className="text-lg font-bold leading-none">
            {profile.stats?.totalPoints ?? 0}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            {t("profile.points", { defaultValue: "Points" })}
          </div>
        </Card>
        <Card className="p-3 flex flex-col items-center">
          <Award className="h-4 w-4 text-primary mb-1" />
          <div className="text-lg font-bold leading-none">
            {Array.isArray(profile.badges) ? profile.badges.length : 0}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            {t("profile.badges", { defaultValue: "Badges" })}
          </div>
        </Card>
      </section>

      {Array.isArray(profile.badges) && profile.badges.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {t("profile.badges", { defaultValue: "Badges" })}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {profile.badges.map((b) => (
              <Card
                key={b.id}
                className="p-3 flex flex-col items-center text-center"
                data-testid={`public-badge-${b.key}`}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Award className="h-6 w-6" />
                </div>
                <div className="text-[11px] font-bold leading-tight">{b.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{b.tier}</div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
