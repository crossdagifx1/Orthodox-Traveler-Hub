import { useListNews, getListNewsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";

export function News() {
  const { data: news, isLoading } = useListNews({}, { query: { queryKey: getListNewsQueryKey({}) } });

  return (
    <div className="p-4 pb-20 bg-background">
      <h1 className="text-2xl font-serif font-bold text-primary mb-6 mt-2">News & Teachings</h1>
      
      <div className="space-y-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)
        ) : news?.map((post, i) => (
          <Link key={post.id} href={`/news/${post.id}`}>
            <article className={`flex gap-4 cursor-pointer group ${i !== 0 ? 'pt-6 border-t border-border/50' : ''}`}>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">{post.category}</div>
                <h2 className="text-lg font-serif font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{post.readMinutes} min read</span>
                </div>
              </div>
              <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden bg-muted">
                <img src={post.coverUrl || "https://placehold.co/200x200"} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
