import { useTranslation } from "react-i18next";
import {
  getListReactionsQueryKey,
  useCreateReaction,
  useDeleteReaction,
  useListReactions,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { useOffline } from "@/hooks/useOffline";
import { useOfflineQueue } from "@/hooks/useServiceWorker";
import { cn } from "@/lib/utils";

const KINDS = [
  { kind: "heart", emoji: "❤️", labelKey: "engagement.heart", labelDefault: "Love" },
  { kind: "pray", emoji: "🙏", labelKey: "engagement.pray", labelDefault: "Pray" },
  { kind: "cross", emoji: "✝️", labelKey: "engagement.cross", labelDefault: "Bless" },
  { kind: "thumb", emoji: "👍", labelKey: "engagement.thumb", labelDefault: "Thanks" },
] as const;

type Kind = (typeof KINDS)[number]["kind"];

type Props = {
  targetType:
    | "destination"
    | "church"
    | "mezmur"
    | "news"
    | "marketplace"
    | "quiz";
  targetId: string;
  className?: string;
};

export function ReactionsBar({ targetType, targetId, className }: Props) {
  const { t } = useTranslation();
  const { isAuthed, openLogin } = useAuth();
  const qc = useQueryClient();

  const params = { targetType, targetId };
  const { data } = useListReactions(params, {
    query: {
      enabled: !!targetId,
      queryKey: getListReactionsQueryKey(params),
    },
  });

  const createMutation = useCreateReaction();
  const deleteMutation = useDeleteReaction();

  const summary = (data?.summary ?? {}) as Record<string, number>;
  const mine = new Set<Kind>((data?.mine ?? []) as Kind[]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListReactionsQueryKey(params) });

  const isOffline = useOffline();
  const { addToQueue } = useOfflineQueue();

  const toggle = (kind: Kind) => {
    if (!isAuthed) {
      openLogin(
        t("engagement.signInToReact", {
          defaultValue: "Sign in to react",
        }),
      );
      return;
    }

    if (isOffline) {
      const method = mine.has(kind) ? "DELETE" : "POST";
      const url = "/api/reactions"; // Simplified for demonstration
      
      addToQueue({
        url,
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, kind }),
      });
      
      // Optimistically update the UI by invalidating or manually updating cache
      invalidate();
      return;
    }

    if (mine.has(kind)) {
      deleteMutation.mutate(
        { params: { targetType, targetId, kind } },
        { onSuccess: invalidate },
      );
    } else {
      createMutation.mutate(
        { data: { targetType, targetId, kind } },
        { onSuccess: invalidate },
      );
    }
  };

  return (
    <div
      className={cn("flex items-center flex-wrap gap-2", className)}
      data-testid={`reactions-${targetType}-${targetId}`}
    >
      {KINDS.map(({ kind, emoji, labelKey, labelDefault }) => {
        const count = summary[kind] ?? 0;
        const active = mine.has(kind);
        return (
          <button
            key={kind}
            type="button"
            onClick={() => toggle(kind)}
            aria-label={t(labelKey, { defaultValue: labelDefault })}
            data-testid={`button-react-${kind}`}
            className={cn(
              "h-9 px-3 rounded-full flex items-center gap-1.5 text-sm",
              "border bg-background/80 backdrop-blur-sm shadow-sm",
              "hover-elevate active-elevate-2 transition-colors",
              active
                ? "border-primary/60 text-foreground bg-primary/10"
                : "border-border/60 text-muted-foreground",
            )}
          >
            <span aria-hidden className="text-base leading-none">
              {emoji}
            </span>
            {count > 0 && (
              <span className="text-xs font-bold tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
