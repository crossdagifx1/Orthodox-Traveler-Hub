import { ReactionsBar } from "./ReactionsBar";
import { CommentsThread } from "./CommentsThread";
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

/**
 * Combined engagement footer to drop at the bottom of every detail page.
 * Renders a horizontal reactions bar followed by the comments thread. Both
 * bail out cleanly if `targetId` is empty.
 */
export function EngagementSection({ targetType, targetId, className }: Props) {
  if (!targetId) return null;
  return (
    <section
      className={cn(
        "mt-8 px-4 pb-8 max-w-3xl mx-auto space-y-6 border-t border-border/40 pt-6",
        className,
      )}
      data-testid={`engagement-${targetType}-${targetId}`}
    >
      <ReactionsBar targetType={targetType} targetId={targetId} />
      <CommentsThread targetType={targetType} targetId={targetId} />
    </section>
  );
}
