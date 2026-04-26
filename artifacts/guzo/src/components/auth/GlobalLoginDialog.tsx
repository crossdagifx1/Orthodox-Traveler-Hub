import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function GlobalLoginDialog() {
  const { t } = useTranslation();
  const { loginDialogOpen, loginReason, closeLogin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const login = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  useEffect(() => {
    if (!loginDialogOpen) form.reset();
  }, [loginDialogOpen, form]);

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(
      { data },
      {
        onSuccess: (resp) => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({ title: t("auth.welcomeBack", { name: resp.name }) });
          closeLogin();
        },
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          toast({
            title:
              status === 401
                ? t("auth.invalidCredentials")
                : t("common.errorOccurred"),
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Dialog open={loginDialogOpen} onOpenChange={(o) => !o && closeLogin()}>
      <DialogContent
        className="sm:max-w-md max-w-[90vw] p-0 overflow-hidden rounded-2xl"
        data-testid="dialog-login"
      >
        <div className="relative h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="p-6 pt-0">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-serif text-primary text-center">
              {t("auth.signInTitle")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {loginReason ?? t("auth.signInSubtitle")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        autoComplete="email"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("auth.passwordPlaceholder")}
                        autoComplete="current-password"
                        data-testid="input-password"
                        {...field}
                      />
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
                    <FormLabel>
                      {t("auth.name")}{" "}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({t("auth.nameOptional")})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("auth.namePlaceholder")}
                        autoComplete="name"
                        data-testid="input-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full rounded-full mt-2"
                disabled={login.isPending}
                data-testid="button-login-submit"
              >
                {login.isPending ? t("common.loading") : t("auth.continue")}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                {t("auth.signupHint")}
              </p>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
