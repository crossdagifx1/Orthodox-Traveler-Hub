import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import {
  Flag,
  Heart,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  getListCommentsQueryKey,
  useCreateComment,
  useDeleteComment,
  useLikeComment,
  useListComments,
  useReportComment,
  useUnlikeComment,
  useUpdateComment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

type TargetType =
  | "destination"
  | "church"
  | "mezmur"
  | "news"
  | "marketplace"
  | "quiz";

type Props = {
  targetType: TargetType;
  targetId: string;
  className?: string;
};

type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  parentId?: string | null;
  body: string;
  likesCount: number;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
  updatedAt: string;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function initialsOf(name?: string) {
  return (name || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CommentsThread({ targetType, targetId, className }: Props) {
  const { t } = useTranslation();
  const { isAuthed, user, openLogin } = useAuth();
  const qc = useQueryClient();

  const params = { targetType, targetId };
  const { data, isLoading } = useListComments(params, {
    query: {
      enabled: !!targetId,
      queryKey: getListCommentsQueryKey(params),
    },
  });

  const createMutation = useCreateComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();
  const likeMutation = useLikeComment();
  const unlikeMutation = useUnlikeComment();
  const reportMutation = useReportComment();

  const [newBody, setNewBody] = useState("");
  const [replyParent, setReplyParent] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  // Local optimistic "I liked this" set (the API doesn't tell us which comments
  // the caller has liked; we track it client-side per session).
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());

  const all = (Array.isArray(data) ? data : []) as Comment[];

  const { roots, childrenByParent } = useMemo(() => {
    const roots: Comment[] = [];
    const childrenByParent = new Map<string, Comment[]>();
    for (const c of all) {
      if (c.parentId) {
        const arr = childrenByParent.get(c.parentId) ?? [];
        arr.push(c);
        childrenByParent.set(c.parentId, arr);
      } else {
        roots.push(c);
      }
    }
    return { roots, childrenByParent };
  }, [all]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListCommentsQueryKey(params) });

  const requireAuth = (reason: string) => {
    if (!isAuthed) {
      openLogin(reason);
      return false;
    }
    return true;
  };

  const submitNew = () => {
    const body = newBody.trim();
    if (!body) return;
    if (!requireAuth(t("engagement.signInToComment", { defaultValue: "Sign in to comment" }))) return;
    createMutation.mutate(
      { data: { targetType, targetId, body } },
      {
        onSuccess: () => {
          setNewBody("");
          invalidate();
        },
      },
    );
  };

  const submitReply = (parentId: string) => {
    const body = replyBody.trim();
    if (!body) return;
    if (!requireAuth(t("engagement.signInToReply", { defaultValue: "Sign in to reply" }))) return;
    createMutation.mutate(
      { data: { targetType, targetId, parentId, body } },
      {
        onSuccess: () => {
          setReplyParent(null);
          setReplyBody("");
          invalidate();
        },
      },
    );
  };

  const submitEdit = (id: string) => {
    const body = editBody.trim();
    if (!body) return;
    updateMutation.mutate(
      { id, data: { body } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditBody("");
          invalidate();
        },
      },
    );
  };

  const onDelete = (id: string) => {
    if (!confirm(t("engagement.confirmDelete", { defaultValue: "Delete this comment?" }))) {
      return;
    }
    deleteMutation.mutate({ id }, { onSuccess: invalidate });
  };

  const onLikeToggle = (id: string) => {
    if (!requireAuth(t("engagement.signInToLike", { defaultValue: "Sign in to like" }))) return;
    if (likedIds.has(id)) {
      unlikeMutation.mutate(
        { id },
        {
          onSuccess: () => {
            setLikedIds((prev) => {
              const n = new Set(prev);
              n.delete(id);
              return n;
            });
            invalidate();
          },
        },
      );
    } else {
      likeMutation.mutate(
        { id },
        {
          onSuccess: () => {
            setLikedIds((prev) => new Set(prev).add(id));
            invalidate();
          },
        },
      );
    }
  };

  const onReport = (id: string) => {
    if (!requireAuth(t("engagement.signInToReport", { defaultValue: "Sign in to report" }))) return;
    const reason = prompt(t("engagement.reportPrompt", { defaultValue: "Reason (optional)" }));
    reportMutation.mutate(
      { id, data: { reason: reason || "" } },
      {
        onSuccess: () =>
          alert(t("engagement.reportThanks", { defaultValue: "Thanks. Our team will review it." })),
      },
    );
  };

  const renderComment = (c: Comment, isReply = false) => {
    const isMine = !!user && c.userId === user.id;
    const isEditing = editingId === c.id;
    const liked = likedIds.has(c.id);
    return (
      <li
        key={c.id}
        className={cn("py-3", isReply && "pl-8 border-l border-border/40 ml-3")}
        data-testid={`comment-${c.id}`}
      >
        <div className="flex gap-2">
          <Link href={`/u/${c.userId}`} className="shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={c.userAvatarUrl} alt={c.userName} />
              <AvatarFallback className="text-[10px] font-bold">
                {initialsOf(c.userName)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs">
              <Link
                href={`/u/${c.userId}`}
                className="font-bold hover:underline"
                data-testid={`link-user-${c.userId}`}
              >
                {c.userName}
              </Link>
              <span className="text-muted-foreground">{timeAgo(c.createdAt)}</span>
              {c.updatedAt !== c.createdAt && (
                <span className="text-muted-foreground italic">
                  {t("engagement.edited", { defaultValue: "edited" })}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-1 space-y-2">
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={2}
                  data-testid={`textarea-edit-${c.id}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => submitEdit(c.id)}
                    disabled={updateMutation.isPending || !editBody.trim()}
                  >
                    {t("common.save", { defaultValue: "Save" })}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      setEditingId(null);
                      setEditBody("");
                    }}
                  >
                    {t("common.cancel", { defaultValue: "Cancel" })}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap mt-0.5">
                {c.body}
              </p>
            )}

            {!isEditing && (
              <div className="flex items-center gap-1 mt-1.5 -ml-2">
                <button
                  type="button"
                  onClick={() => onLikeToggle(c.id)}
                  className={cn(
                    "h-7 px-2 rounded-full text-xs flex items-center gap-1 hover-elevate",
                    liked && "text-primary",
                  )}
                  aria-label={t("engagement.like", { defaultValue: "Like" })}
                  data-testid={`button-like-${c.id}`}
                >
                  <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                  {c.likesCount > 0 && <span className="tabular-nums">{c.likesCount}</span>}
                </button>

                {!isReply && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyParent(c.id);
                      setReplyBody("");
                    }}
                    className="h-7 px-2 rounded-full text-xs flex items-center gap-1 hover-elevate text-muted-foreground"
                    data-testid={`button-reply-${c.id}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {t("engagement.reply", { defaultValue: "Reply" })}
                  </button>
                )}

                {isMine ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditBody(c.body);
                      }}
                      className="h-7 px-2 rounded-full text-xs flex items-center gap-1 hover-elevate text-muted-foreground"
                      data-testid={`button-edit-${c.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="h-7 px-2 rounded-full text-xs flex items-center gap-1 hover-elevate text-destructive"
                      data-testid={`button-delete-${c.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReport(c.id)}
                    className="h-7 px-2 rounded-full text-xs flex items-center gap-1 hover-elevate text-muted-foreground"
                    data-testid={`button-report-${c.id}`}
                  >
                    <Flag className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {!isReply && replyParent === c.id && (
              <div className="mt-2 flex gap-2">
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={2}
                  placeholder={t("engagement.writeReply", {
                    defaultValue: "Write a reply…",
                  })}
                  data-testid={`textarea-reply-${c.id}`}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    className="rounded-full h-9 w-9"
                    onClick={() => submitReply(c.id)}
                    disabled={createMutation.isPending || !replyBody.trim()}
                    data-testid={`button-submit-reply-${c.id}`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-9 w-9"
                    onClick={() => {
                      setReplyParent(null);
                      setReplyBody("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {!isReply && (childrenByParent.get(c.id)?.length ?? 0) > 0 && (
          <ul className="mt-1">
            {childrenByParent.get(c.id)!.map((child) => renderComment(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section
      className={cn("space-y-3", className)}
      data-testid={`comments-${targetType}-${targetId}`}
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {t("engagement.comments", { defaultValue: "Comments" })}
        {all.length > 0 && (
          <span className="ml-2 text-foreground/60 normal-case tracking-normal">
            ({all.length})
          </span>
        )}
      </h2>

      {/* New comment box */}
      <div className="flex gap-2">
        <Textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={2}
          placeholder={
            isAuthed
              ? t("engagement.writeComment", { defaultValue: "Write a comment…" })
              : t("engagement.signInToCommentLong", {
                  defaultValue: "Sign in to join the conversation…",
                })
          }
          onFocus={() => {
            if (!isAuthed)
              openLogin(
                t("engagement.signInToComment", {
                  defaultValue: "Sign in to comment",
                }),
              );
          }}
          data-testid="textarea-new-comment"
        />
        <Button
          size="icon"
          className="rounded-full h-9 w-9 self-end"
          onClick={submitNew}
          disabled={createMutation.isPending || !newBody.trim()}
          data-testid="button-submit-comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : roots.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {t("engagement.noCommentsYet", {
            defaultValue: "No comments yet. Be the first.",
          })}
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {roots.map((c) => renderComment(c))}
        </ul>
      )}
    </section>
  );
}
