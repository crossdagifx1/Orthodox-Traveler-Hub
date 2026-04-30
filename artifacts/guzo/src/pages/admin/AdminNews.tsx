import {
  useListNews,
  useDeleteNewsPost,
  useCreateNewsPost,
  getListNewsQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EntityFormSheet } from "@/components/admin/EntityFormSheet";
import { NEWS_FIELDS } from "@/components/admin/entity-fields";

export function AdminNews() {
  const { data: news, isLoading } = useListNews({}, { query: { queryKey: getListNewsQueryKey({}) } });
  const deleteNews = useDeleteNewsPost();
  const createNews = useCreateNewsPost();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure?")) return;
    deleteNews.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNewsQueryKey({}) });
        toast({ title: "Deleted successfully" });
      }
    });
  };

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-serif font-bold text-primary flex-1">News & Teachings</h1>
        <Button
          size="sm"
          className="rounded-full shadow-sm"
          onClick={() => setCreateOpen(true)}
          data-testid="button-new-news"
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      <EntityFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New post"
        description="Publish news, a teaching, or an announcement."
        submitLabel="Create"
        fields={NEWS_FIELDS}
        isPending={createNews.isPending}
        onSubmit={async (values) => {
          await createNews.mutateAsync({ data: values as any });
          await queryClient.invalidateQueries({ queryKey: getListNewsQueryKey({}) });
          toast({ title: "Post created" });
        }}
      />

      <div className="space-y-3">
        {isLoading ? (
          <div className="animate-pulse space-y-3"><div className="h-20 bg-muted rounded-2xl"/><div className="h-20 bg-muted rounded-2xl"/></div>
        ) : (
          (Array.isArray(news) ? news : []).map(post => (
            <div key={post.id} className="bg-card p-3 rounded-2xl border border-border/50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{post.title}</div>
                <div className="text-xs text-muted-foreground truncate">{post.author}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(post.id)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
