import { useListNews, getListNewsQueryKey } from "@workspace/api-client-react";

import { Link } from "wouter";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { format } from "date-fns";

import { Search, Newspaper } from "lucide-react";

import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";



export function News() {

  const { t } = useTranslation();

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");



  const { data: news, isLoading } = useListNews(

    {

      q: search || undefined,

      category: category === "All" ? undefined : category,

    },

    {

      query: {

        queryKey: getListNewsQueryKey({

          q: search || undefined,

          category: category === "All" ? undefined : category,

        }),

      },

    },

  );



  const categories = useMemo(() => {

    const set = new Set<string>();

    (news ?? []).forEach((n) => n.category && set.add(n.category));

    return ["All", ...Array.from(set)];

  }, [news]);



  const featured = (news ?? [])[0];

  const rest = (news ?? []).slice(1);



  return (

    <div className="pb-20 bg-background min-h-full">

      <header className="px-4 pt-4 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-30 border-b border-border/40 flex flex-col items-center text-center">
        <h1 className="text-2xl font-serif font-bold text-primary mb-0.5">{t("news.title")}</h1>
        <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-widest">{t("news.subtitle")}</p>

        <div className="relative mb-3">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input

            placeholder={t("news.searchPlaceholder")}

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            className="pl-9 bg-card border-border/60 rounded-full"

            data-testid="input-search-news"

          />

        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">

          {categories.map((c) => (

            <button

              key={c}

              onClick={() => setCategory(c)}

              data-testid={`chip-news-${c}`}

              className={cn(

                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors hover-elevate active-elevate-2",

                category === c

                  ? "bg-primary text-primary-foreground shadow-sm"

                  : "bg-card border border-border/60 text-muted-foreground",

              )}

            >

              {t(`news.categories.${c}`, { defaultValue: c })}

            </button>

          ))}

        </div>

      </header>



      <div className="p-4">

        {isLoading ? (

          <div className="space-y-4">

            {[1, 2, 3].map((i) => (

              <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />

            ))}

          </div>

        ) : (news?.length ?? 0) === 0 ? (

          <div className="text-center py-16 text-muted-foreground">

            <Newspaper className="h-10 w-10 mx-auto opacity-30 mb-3" />

            <p className="font-serif">{t("news.noPosts")}</p>

          </div>

        ) : (

          <>

            {featured && (

              <Link href={`/news/${featured.id}`}>

                <article

                  className="block mb-6 cursor-pointer group"

                  data-testid={`card-news-featured-${featured.id}`}

                >

                  <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-muted mb-3 relative">

                    <img

                      src={featured.coverUrl || "https://placehold.co/800x500"}

                      alt={featured.title}

                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"

                    />

                    <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur text-primary-foreground text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">

                      {t(`news.categories.${featured.category}`, { defaultValue: featured.category })}

                    </div>

                  </div>

                  <h2 className="text-xl font-serif font-bold leading-tight group-hover:text-primary transition-colors mb-2">

                    {featured.title}

                  </h2>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">

                    {featured.excerpt}

                  </p>

                  <div className="text-xs text-muted-foreground flex items-center gap-2">

                    <span>{format(new Date(featured.publishedAt), "MMM d, yyyy")}</span>

                    <span>•</span>

                    <span>{t("common.minRead", { count: featured.readMinutes ?? 3 })}</span>

                  </div>

                </article>

              </Link>

            )}



            <div className="space-y-5">

              {rest.map((post) => (

                <Link key={post.id} href={`/news/${post.id}`}>

                  <article

                    className="flex gap-4 cursor-pointer group pt-5 border-t border-border/60"

                    data-testid={`card-news-${post.id}`}

                  >

                    <div className="flex-1 min-w-0">

                      <div className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1.5">

                        {t(`news.categories.${post.category}`, { defaultValue: post.category })}

                      </div>

                      <h2 className="text-base font-serif font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">

                        {post.title}

                      </h2>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">

                        {post.excerpt}

                      </p>

                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">

                        <span>{format(new Date(post.publishedAt), "MMM d, yyyy")}</span>

                        <span>•</span>

                        <span>{t("common.minRead", { count: post.readMinutes ?? 3 })}</span>

                      </div>

                    </div>

                    <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-muted">

                      <img

                        src={post.coverUrl || "https://placehold.co/200x200"}

                        alt={post.title}

                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"

                      />

                    </div>

                  </article>

                </Link>

              ))}

            </div>

          </>

        )}

      </div>

    </div>

  );

}

