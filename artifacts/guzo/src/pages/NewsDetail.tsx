import {

  useGetNewsPost,

  getGetNewsPostQueryKey,

  useListLatestNews,

} from "@workspace/api-client-react";

import { useRoute, Link } from "wouter";

import { ArrowLeft, Clock, Share2, Bookmark, User, Newspaper, ChevronRight } from "lucide-react";

import { useTranslation } from "react-i18next";

import { useMemo, useState } from "react";

import { format, formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";



export function NewsDetail() {

  const { t } = useTranslation();

  const [, params] = useRoute("/news/:id");

  const id = params?.id || "";

  const [bookmarked, setBookmarked] = useState(false);



  const { data: post, isLoading } = useGetNewsPost(id, {

    query: { enabled: !!id, queryKey: getGetNewsPostQueryKey(id) },

  });

  const { data: latest } = useListLatestNews();



  const related = useMemo(() => {

    if (!post || !latest) return [];

    return latest.filter((p) => p.id !== post.id).slice(0, 4);

  }, [post, latest]);



  const onShare = async () => {

    const url = window.location.href;

    if (navigator.share) {

      try { await navigator.share({ title: post?.title, url }); } catch { /* */ }

    } else {

      try { await navigator.clipboard.writeText(url); } catch { /* */ }

    }

  };



  if (isLoading)

    return (

      <div className="p-4 space-y-4">

        <div className="w-full h-64 bg-muted animate-pulse rounded-2xl" />

        <div className="h-6 bg-muted animate-pulse rounded w-3/4" />

      </div>

    );

  if (!post) return <div className="p-8 text-center">Post not found</div>;



  return (

    <div className="pb-16 bg-background min-h-full">

      {/* Hero image */}

      <div className="relative w-full aspect-[4/3]">

        <img

          src={post.coverUrl || "https://placehold.co/800x600"}

          alt={post.title}

          className="w-full h-full object-cover"

        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-background" />




        <div className="absolute top-3 right-3 flex gap-2">

          <Button

            variant="ghost"

            size="icon"

            className="text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md"

            onClick={onShare}

            data-testid="button-share"

          >

            <Share2 className="h-5 w-5" />

          </Button>

          <Button

            variant="ghost"

            size="icon"

            className={cn(

              "text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md",

              bookmarked && "text-primary bg-primary/30",

            )}

            onClick={() => setBookmarked((b) => !b)}

            data-testid="button-bookmark"

          >

            <Bookmark className={cn("h-5 w-5", bookmarked && "fill-current")} />

          </Button>

        </div>



        <div className="absolute bottom-2 left-4 right-4 z-10">

          <span

            className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-primary-foreground px-2.5 py-1 rounded-full"

            style={{ background: "var(--gold-gradient)" }}

          >

            {post.category}

          </span>

        </div>

      </div>



      <div className="px-5 -mt-4 relative z-10">

        {/* Title card */}

        <div className="bg-card border border-border/60 rounded-3xl shadow-xl p-6 mb-6">

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight mb-4">

            {post.title}

          </h1>

          {post.excerpt && (

            <p className="text-base text-muted-foreground leading-relaxed mb-5 italic font-serif">

              {post.excerpt}

            </p>

          )}



          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border/60">

            <div className="flex items-center gap-1 font-semibold text-foreground">

              <User className="h-3.5 w-3.5 text-primary" />

              {post.author}

            </div>

            <Dot />

            <div className="flex items-center gap-1">

              <Clock className="h-3 w-3" />

              {t("common.minRead", { count: post.readMinutes ?? 3 })}

            </div>

            <Dot />

            <div title={format(new Date(post.publishedAt), "PPpp")}>

              {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}

            </div>

          </div>

        </div>



        {/* Article body */}

        <article

          className="prose prose-base dark:prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-loose prose-p:font-serif prose-strong:text-foreground max-w-none px-1"

          data-testid="article-body"

        >

          {post.content.split("\n\n").map((paragraph, i) => {
            const trimmed = paragraph.trim();
            const youtubeId = getYoutubeId(trimmed);

            if (youtubeId) {
              return (
                <div key={i} className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg my-6">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              );
            }

            // Convert lines starting with `- ` into list items
            if (paragraph.split("\n").every((line) => line.trim().startsWith("- "))) {
              return (
                <ul key={i}>
                  {paragraph.split("\n").map((line, j) => (
                    <li key={j}>{line.replace(/^- /, "")}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i}>{paragraph}</p>;
          })}

        </article>



        {/* Share footer */}

        <div className="mt-10 mb-6 rounded-2xl p-5 border border-border/60 bg-muted/30 flex items-center justify-between">

          <div>

            <div className="text-sm font-semibold text-foreground">

              {t("news.enjoyed", { defaultValue: "Enjoyed this story?" })}

            </div>

            <div className="text-xs text-muted-foreground mt-0.5">

              {t("news.shareEncouragement", {

                defaultValue: "Share with the Tewahedo community.",

              })}

            </div>

          </div>

          <Button

            variant="default"

            size="sm"

            className="rounded-full shadow-sm"

            onClick={onShare}

            style={{ background: "var(--gold-gradient)" }}

            data-testid="button-share-bottom"

          >

            <Share2 className="h-4 w-4 mr-1" /> {t("common.share")}

          </Button>

        </div>



        {/* Related news */}

        {related.length > 0 && (

          <section>

            <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-3">

              <Newspaper className="h-4 w-4" />

              {t("news.moreStories", { defaultValue: "More stories" })}

            </div>

            <div className="space-y-3">

              {related.map((p) => (

                <Link key={p.id} href={`/news/${p.id}`}>

                  <article

                    className="flex gap-3 bg-card rounded-2xl p-3 border border-border/60 hover-elevate cursor-pointer"

                    data-testid={`row-related-news-${p.id}`}

                  >

                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">

                      <img

                        src={p.coverUrl || "https://placehold.co/200"}

                        alt={p.title}

                        className="w-full h-full object-cover"

                      />

                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">

                        {p.category}

                      </div>

                      <h3 className="font-serif font-bold text-foreground leading-tight line-clamp-2 mb-1">

                        {p.title}

                      </h3>

                      <div className="text-[10px] text-muted-foreground">

                        {t("common.minRead", { count: p.readMinutes ?? 3 })}

                      </div>

                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground self-center shrink-0" />

                  </article>

                </Link>

              ))}

            </div>

          </section>

        )}

      </div>

    </div>

  );

}



function Dot() {
  return <span className="text-muted-foreground/40">•</span>;
}

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

