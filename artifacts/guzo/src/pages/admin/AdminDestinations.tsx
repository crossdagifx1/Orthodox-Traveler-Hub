import {
  useListDestinations,
  useDeleteDestination,
  useCreateDestination,
  getListDestinationsQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EntityFormSheet } from "@/components/admin/EntityFormSheet";
import { DESTINATION_FIELDS } from "@/components/admin/entity-fields";

export function AdminDestinations() {
  const { data: destinations, isLoading } = useListDestinations({}, { query: { queryKey: getListDestinationsQueryKey({}) } });
  const deleteDest = useDeleteDestination();
  const createDest = useCreateDestination();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure?")) return;
    deleteDest.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDestinationsQueryKey({}) });
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
        <h1 className="text-xl font-serif font-bold text-primary flex-1">Destinations</h1>
        <Button
          size="sm"
          className="rounded-full shadow-sm"
          onClick={() => setCreateOpen(true)}
          data-testid="button-new-destination"
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      <EntityFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New destination"
        description="Add a pilgrimage site or holy place."
        submitLabel="Create"
        fields={DESTINATION_FIELDS}
        isPending={createDest.isPending}
        onSubmit={async (values) => {
          await createDest.mutateAsync({ data: values as any });
          await queryClient.invalidateQueries({ queryKey: getListDestinationsQueryKey({}) });
          toast({ title: "Destination created" });
        }}
      />

      <div className="space-y-3">
        {isLoading ? (
          <div className="animate-pulse space-y-3"><div className="h-20 bg-muted rounded-2xl"/><div className="h-20 bg-muted rounded-2xl"/></div>
        ) : (
          (Array.isArray(destinations) ? destinations : []).map(dest => (
            <div key={dest.id} className="bg-card p-3 rounded-2xl border border-border/50 flex items-center gap-3">
              <img src={dest.imageUrl || "https://placehold.co/100x100"} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{dest.name}</div>
                <div className="text-xs text-muted-foreground truncate">{dest.region}, {dest.country}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(dest.id)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
