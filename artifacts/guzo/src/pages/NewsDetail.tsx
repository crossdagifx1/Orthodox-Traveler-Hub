import { useGetNewsPost, getGetNewsPostQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function NewsDetail() {
  const [, params] = useRoute("/news/:id");
  const id = params?.id || "";

  const { data: post, isLoading } = useGetNewsPost(id, {
    query: { enabled: !!id, queryKey: getGetNewsPostQueryKey(id) }
  });

  if (isLoading) return <div className="p-4 space-y-4"><div className="w-full h-64 bg-muted animate-pulse rounded-2xl" /></div>;
  if (!post) return <div className="p-8 text-center">Post not found</div>;

  return (
    <div className="pb-24 bg-background min-h-full">
      <div className="relative w-full aspect-[4/3]">
        <img src={post.coverUrl || "https://placehold.co/800x600"} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-background" />
        
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        <div className="bg-card p-6 rounded-3xl shadow-xl border border-border/50 mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">{post.category}</div>
          <h1 className="text-3xl font-serif font-bold text-foreground leading-tight mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b border-border/50">
            <div className="font-medium text-foreground">By {post.author}</div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" /> {post.readMinutes} min read
            </div>
            <div>{format(new Date(post.publishedAt), 'MMM d, yyyy')}</div>
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/80 max-w-none px-2 font-serif text-lg leading-relaxed">
          {post.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
