import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getListMyBookmarksQueryKey,
  useCreateBookmark,
  useDeleteBookmark,
  useListMyBookmarks,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Wishlist provider — hybrid storage:
 *  - When the user is signed in, bookmarks are persisted server-side via the
 *    `bookmarks` API (`targetType: "marketplace"`).
 *  - When the user is not signed in, the previous localStorage behaviour is
 *    used so the UI keeps working anonymously.
 *
 * Public API (unchanged): { ids, has, toggle, count }.
 */
type WishlistContextValue = {
  ids: Set<string>;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
};

const Ctx = createContext<WishlistContextValue | null>(null);
const LS_KEY = "guzo-wishlist";

const TARGET = "marketplace" as const;

function readLocal(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const qc = useQueryClient();

  // ── Local (anonymous) storage ─────────────────────────────────────────
  const [localIds, setLocalIds] = useState<Set<string>>(() => readLocal());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, JSON.stringify(Array.from(localIds)));
    }
  }, [localIds]);

  // ── Server (authed) storage ───────────────────────────────────────────
  const params = { targetType: TARGET as "marketplace" };
  const { data: serverBookmarks } = useListMyBookmarks(params, {
    query: { enabled: isAuthed, queryKey: getListMyBookmarksQueryKey(params) },
  });

  const createMutation = useCreateBookmark();
  const deleteMutation = useDeleteBookmark();

  const serverIds = useMemo<Set<string>>(() => {
    if (!isAuthed || !Array.isArray(serverBookmarks)) return new Set();
    return new Set(serverBookmarks.map((b) => b.targetId));
  }, [isAuthed, serverBookmarks]);

  // ── On first sign-in, push any local bookmarks up to the server ──────
  useEffect(() => {
    if (!isAuthed) return;
    if (localIds.size === 0) return;
    const toPush = Array.from(localIds).filter((id) => !serverIds.has(id));
    if (toPush.length === 0) {
      // server already has everything we had locally → drop local copy
      setLocalIds(new Set());
      return;
    }
    Promise.all(
      toPush.map((id) =>
        createMutation.mutateAsync({
          data: { targetType: TARGET, targetId: id },
        }),
      ),
    )
      .then(() => {
        setLocalIds(new Set());
        qc.invalidateQueries({ queryKey: getListMyBookmarksQueryKey(params) });
      })
      .catch(() => {
        /* best-effort sync; will retry next mount */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, serverIds]);

  // ── Public toggle ─────────────────────────────────────────────────────
  const toggle = useCallback(
    (id: string) => {
      if (isAuthed) {
        const exists = serverIds.has(id);
        if (exists) {
          deleteMutation.mutate(
            { params: { targetType: TARGET, targetId: id } },
            {
              onSuccess: () =>
                qc.invalidateQueries({
                  queryKey: getListMyBookmarksQueryKey(params),
                }),
            },
          );
        } else {
          createMutation.mutate(
            { data: { targetType: TARGET, targetId: id } },
            {
              onSuccess: () =>
                qc.invalidateQueries({
                  queryKey: getListMyBookmarksQueryKey(params),
                }),
            },
          );
        }
      } else {
        setLocalIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthed, serverIds],
  );

  const ids = isAuthed ? serverIds : localIds;

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      has: (id) => ids.has(id),
      toggle,
      count: ids.size,
    }),
    [ids, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
