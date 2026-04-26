import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMarketplaceItem, useGetCurrentUser, getListMarketplaceItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const itemSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(1),
  price: z.coerce.number().positive(),
  currency: z.string().default("ETB"),
  description: z.string().min(10),
  imageUrl: z.string().url(),
  sellerLocation: z.string().optional(),
  condition: z.string().default("New"),
  inStock: z.boolean().default(true),
});

type ItemFormValues = z.infer<typeof itemSchema>;

const CATEGORIES = ["Crosses", "Garments", "Icons", "Incense", "Books"];
const CONDITIONS = ["New", "Like New", "Good", "Antique"];

export function MarketplaceNew() {
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createItem = useCreateMarketplaceItem();

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      category: "",
      price: 0,
      currency: "ETB",
      description: "",
      imageUrl: "",
      sellerLocation: "",
      condition: "New",
      inStock: true,
    },
  });

  // Redirect if not logged in (would normally be handled by a router guard, but handling here for simplicity)
  if (!userLoading && !user?.user) {
    setLocation("/marketplace");
    return null;
  }

  const onSubmit = (data: ItemFormValues) => {
    if (!user?.user) return;
    
    createItem.mutate(
      { data: { ...data, sellerName: user.user.name || user.user.email } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMarketplaceItemsQueryKey({}) });
          toast({ title: "Item listed successfully" });
          setLocation("/marketplace");
        },
        onError: () => {
          toast({ title: "Failed to list item", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-serif font-bold text-primary">List New Item</h1>
      </div>

      <div className="bg-card p-6 rounded-3xl shadow-sm border border-border/50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="e.g. Silver Lalibela Cross" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ETB">ETB</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sellerLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Location (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. Addis Ababa" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the item..." className="resize-none min-h-[100px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inStock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-background">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-bold">In Stock</FormLabel>
                    <div className="text-xs text-muted-foreground">Is this item currently available?</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-6 h-12 rounded-full text-base shadow-md" disabled={createItem.isPending}>
              {createItem.isPending ? "Listing..." : "Post Item"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
