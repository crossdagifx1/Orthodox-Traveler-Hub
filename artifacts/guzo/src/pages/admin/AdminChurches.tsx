import { useListChurches, useDeleteChurch, getListChurchesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function AdminChurches() {
  const { data: churches, isLoading } = useListChurches({}, { query: { queryKey: getListChurchesQueryKey({}) } });
  const deleteChurch = useDeleteChurch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure?")) return;
    deleteChurch.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChurchesQueryKey({}) });
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
        <h1 className="text-xl font-serif font-bold text-primary flex-1">Churches</h1>
        <Button size="sm" className="rounded-full shadow-sm">
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="animate-pulse space-y-3"><div className="h-20 bg-muted rounded-2xl"/><div className="h-20 bg-muted rounded-2xl"/></div>
        ) : (
          churches?.map(church => (
            <div key={church.id} className="bg-card p-3 rounded-2xl border border-border/50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{church.name}</div>
                <div className="text-xs text-muted-foreground truncate">{church.city}, {church.country}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(church.id)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
