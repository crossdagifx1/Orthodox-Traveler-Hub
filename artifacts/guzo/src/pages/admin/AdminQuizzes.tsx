import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  GraduationCap,
  Hash,
  Target,
  ScrollText,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useQaListQuizzes,
  getQaListQuizzesQueryKey,
  qaCreateQuiz,
  qaDeleteQuiz,
  qaUpdateQuiz,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DIFFS = ["easy", "medium", "hard", "expert"] as const;

export function AdminQuizzes() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<(typeof DIFFS)[number]>("easy");
  const { user, isStaff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = { q: search || undefined, status: "" as any, limit: 200 };
  const { data: quizzes, isLoading } = useQaListQuizzes(params, {
    query: {
      queryKey: getQaListQuizzesQueryKey(params),
      enabled: isStaff,
    },
  });

  const refresh = () =>
    qc.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && String(q.queryKey[0] ?? "").includes("/qa/quizzes"),
    });

  const create = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const q = await qaCreateQuiz({
        title: newTitle.trim(),
        difficulty: newDifficulty,
        status: "draft",
      });
      toast({ title: t("learn.created"), description: `Code: ${q.code}` });
      setNewTitle("");
      await refresh();
      navigate(`/admin/qa/${q.id}`);
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (q: any) => {
    const next = q.status === "published" ? "draft" : "published";
    try {
      await qaUpdateQuiz(q.id, { status: next });
      toast({ title: next === "published" ? t("learn.published") : t("learn.unpublished") });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  const remove = async (q: any) => {
    if (!confirm(`Delete "${q.title}"? This deletes its questions and all attempts.`)) return;
    try {
      await qaDeleteQuiz(q.id);
      toast({ title: t("learn.deleted") });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  if (!isStaff) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t("admin.accessDenied")}</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="rounded-full" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.back")}
            </Button>
          </Link>
          <div className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" /> {t("admin.qa.title")}
          </div>
        </div>
        <h1 className="text-2xl font-serif font-bold mb-1">{t("admin.qa.heading")}</h1>
        <p className="text-xs text-muted-foreground mb-3">{t("admin.qa.subtitle")}</p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.qa.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-card"
              data-testid="input-search-quizzes-admin"
            />
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Create new */}
        <div className="rounded-2xl border border-primary/30 bg-card p-4 mb-4">
          <div className="font-bold mb-2 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-primary" /> {t("admin.qa.createNew")}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTitle}
              placeholder={t("admin.qa.newTitlePlaceholder")}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              className="rounded-full"
              data-testid="input-new-quiz-title"
            />
            <select
              value={newDifficulty}
              onChange={(e) => setNewDifficulty(e.target.value as any)}
              className="rounded-full bg-card border border-border px-3 text-sm"
              data-testid="select-new-quiz-difficulty"
            >
              {DIFFS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Button
              onClick={create}
              disabled={creating || !newTitle.trim()}
              className="rounded-full"
              data-testid="button-create-quiz"
            >
              <Plus className="h-4 w-4 mr-1" /> {t("admin.qa.create")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !quizzes || quizzes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <ScrollText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t("admin.qa.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(quizzes) ? quizzes : []).map((q) => {
              const canEdit =
                user?.role === "admin" ||
                user?.role === "superadmin" ||
                q.authorId === Number(user?.id);
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border/60 bg-card p-3"
                  data-testid={`admin-quiz-row-${q.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold line-clamp-1">{q.title}</h3>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                            q.status === "published"
                              ? "bg-emerald-100 text-emerald-700"
                              : q.status === "draft"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-zinc-100 text-zinc-700",
                          )}
                          data-testid={`badge-status-${q.id}`}
                        >
                          {q.status}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {q.difficulty}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" /> {q.code}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" /> {q.pointsTotal} pts
                        </span>
                        <span>by {q.authorName || "—"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <div className="flex gap-1">
                        {canEdit ? (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full"
                            onClick={() => togglePublish(q)}
                            data-testid={`button-toggle-publish-${q.id}`}
                            title={q.status === "published" ? "Unpublish" : "Publish"}
                          >
                            {q.status === "published" ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        ) : null}
                        <Link href={`/admin/qa/${q.id}`}>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full"
                            data-testid={`button-edit-quiz-${q.id}`}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {canEdit ? (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full text-destructive"
                            onClick={() => remove(q)}
                            data-testid={`button-delete-quiz-${q.id}`}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
