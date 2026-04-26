import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

const loginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const login = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({ title: "Welcome to Guzo" });
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to login", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[90vw] p-0 overflow-hidden rounded-2xl">
        <div className="relative h-40 bg-muted">
          <img src="/images/login-art.png" alt="Login Art" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="p-6 pt-0">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif text-primary text-center">Welcome</DialogTitle>
            <DialogDescription className="text-center">Sign in to post items or contact sellers.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? "Signing in..." : "Continue"}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
