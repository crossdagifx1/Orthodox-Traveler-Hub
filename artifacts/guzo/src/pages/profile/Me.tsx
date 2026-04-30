import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Award,
  Bookmark as BookmarkIcon,
  Flame,
  LogOut,
  Pencil,
  Save,
  Star,
  X,
} from "lucide-react";
import {
  getGetMyProfileQueryKey,
  getListMyBadgesQueryKey,
  getListMyBookmarksQueryKey,
  useGetMyProfile,
  useListMyBadges,
  useListMyBookmarks,
  useUpdateMyProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";

const TARGET_PATHS: Record<string, string> = {
  destination: "/destinations",
  church: "/churches",
  mezmur: "/mezmurs",
  news: "/news",
  marketplace: "/marketplace",
  quiz: "/learn/quizzes",
};

function StatBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
          {label}
        </div>
      </div>
    </Card>
  );
}

export function MeProfile() {
  const { t } = useTranslation();
  const { isAuthed, isLoading: isAuthLoading, openLogin, logout } = useAuth();
  const qc = useQueryClient();

  const { data: me, isLoading: isMeLoading } = useGetMyProfile({
    query: { enabled: isAuthed, queryKey: getGetMyProfileQueryKey() },
  });
  const { data: badges } = useListMyBadges({
    query: { enabled: isAuthed, queryKey: getListMyBadgesQueryKey() },
  });
  const { data: bookmarks } = useListMyBookmarks(undefined, {
    query: {
      enabled: isAuthed,
      queryKey: getListMyBookmarksQueryKey(undefined),
    },
  });

  const updateMutation = useUpdateMyProfile();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
    isPublic: false,
  });

  useEffect(() => {
    if (me) {
      setForm({
        displayName: me.displayName ?? "",
        bio: me.bio ?? "",
        avatarUrl: me.avatarUrl ?? "",
        isPublic: !!me.isPublic,
      });
    }
  }, [me]);

  // Bucketize bookmarks by target type
  const bookmarksByType = useMemo(() => {
    const groups: Record<string, { id: string; targetId: string }[]> = {};
    if (!Array.isArray(bookmarks)) return groups;
    for (const b of bookmarks) {
      const key = String(b.targetType);
      (groups[key] ??= []).push({ id: b.id, targetId: b.targetId });
    }
    return groups;
  }, [bookmarks]);

  const onSave = () => {
    updateMutation.mutate(
      { data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
          setEditing(false);
        },
      },
    );
  };

  if (isAuthLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">
          {t("profile.signInToView", {
            defaultValue: "Sign in to view your profile.",
          })}
        </p>
        <Button onClick={() => openLogin()} data-testid="button-profile-signin">
          {t("auth.signIn")}
        </Button>
      </div>
    );
  }

  if (isMeLoading || !me) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  const initials =
    (me.displayName || me.name || me.email || "?")
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="pb-24">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {!editing ? (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => setEditing(true)}
                data-testid="button-edit-profile"
              >
                <Pencil className="h-4 w-4 mr-1" />
                {t("profile.edit", { defaultValue: "Edit" })}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={onSave}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {t("common.save", { defaultValue: "Save" })}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-destructive"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Profile head */}
      <section className="px-4 pt-6 flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-3">
          <AvatarImage src={form.avatarUrl || me.avatarUrl} alt={me.displayName || me.name} />
          <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>

        {!editing ? (
          <>
            <h1 className="text-xl font-bold">{me.displayName || me.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{me.email}</p>
            {me.bio && (
              <p className="text-sm text-foreground/80 mt-3 max-w-md">{me.bio}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase">
                {me.role}
              </Badge>
              {me.isPublic && (
                <Badge variant="outline" className="text-[10px]">
                  {t("profile.public", { defaultValue: "Public" })}
                </Badge>
              )}
            </div>
          </>
        ) : (
          <div className="w-full max-w-md space-y-3 mt-2">
            <div>
              <Label htmlFor="displayName" className="text-xs">
                {t("profile.displayName", { defaultValue: "Display name" })}
              </Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                data-testid="input-display-name"
              />
            </div>
            <div>
              <Label htmlFor="avatarUrl" className="text-xs">
                {t("profile.avatarUrl", { defaultValue: "Avatar URL" })}
              </Label>
              <Input
                id="avatarUrl"
                value={form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                data-testid="input-avatar-url"
              />
            </div>
            <div>
              <Label htmlFor="bio" className="text-xs">
                {t("profile.bio", { defaultValue: "Bio" })}
              </Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                data-testid="input-bio"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <Label htmlFor="isPublic" className="text-sm">
                {t("profile.isPublic", { defaultValue: "Show profile publicly" })}
              </Label>
              <Switch
                id="isPublic"
                checked={form.isPublic}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPublic: !!v }))}
                data-testid="switch-is-public"
              />
            </div>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="px-4 mt-6 grid grid-cols-2 gap-2">
        <StatBlock
          label={t("profile.streak", { defaultValue: "Day streak" })}
          value={me.stats?.currentStreak ?? 0}
          icon={<Flame className="h-4 w-4" />}
        />
        <StatBlock
          label={t("profile.points", { defaultValue: "Points" })}
          value={me.stats?.totalPoints ?? 0}
          icon={<Star className="h-4 w-4" />}
        />
        <StatBlock
          label={t("profile.badges", { defaultValue: "Badges" })}
          value={me.stats?.badgesEarned ?? 0}
          icon={<Award className="h-4 w-4" />}
        />
        <StatBlock
          label={t("profile.bookmarks", { defaultValue: "Bookmarks" })}
          value={me.stats?.bookmarksCount ?? 0}
          icon={<BookmarkIcon className="h-4 w-4" />}
        />
      </section>

      {/* Tabs */}
      <section className="px-4 mt-6">
        <Tabs defaultValue="bookmarks">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">
              {t("profile.bookmarks", { defaultValue: "Bookmarks" })}
            </TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">
              {t("profile.badges", { defaultValue: "Badges" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarks" className="mt-3 space-y-3">
            {Object.keys(bookmarksByType).length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                {t("profile.noBookmarks", {
                  defaultValue: "No bookmarks yet. Tap the heart on anything you love.",
                })}
              </Card>
            ) : (
              Object.entries(bookmarksByType).map(([type, items]) => (
                <Card key={type} className="p-3">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {type}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((b) => {
                      const path = TARGET_PATHS[type] ?? "/";
                      return (
                        <Link
                          key={b.id}
                          href={`${path}/${b.targetId}`}
                          className="text-xs rounded-full border border-border/60 px-3 py-1 hover-elevate"
                          data-testid={`link-bookmark-${b.id}`}
                        >
                          {b.targetId.slice(0, 8)}
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="badges" className="mt-3">
            {!Array.isArray(badges) || badges.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                {t("profile.noBadges", {
                  defaultValue: "Earn badges by completing quizzes and keeping streaks.",
                })}
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {badges.map((b) => {
                  const earned = !!b.awardedAt;
                  return (
                    <Card
                      key={b.id}
                      className={
                        "p-3 flex flex-col items-center text-center " +
                        (earned ? "" : "opacity-40")
                      }
                      data-testid={`badge-${b.key}`}
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="text-[11px] font-bold leading-tight">{b.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{b.tier}</div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
