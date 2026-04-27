import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, Settings as SettingsIcon, Save, Plus, Crown } from "lucide-react";
import {
  useAdminGetSystemSettings,
  getAdminGetSystemSettingsQueryKey,
  useAdminUpdateSystemSetting,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export function AdminSettings() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const queryKey = getAdminGetSystemSettingsQueryKey();
  const { data: settings, isLoading } = useAdminGetSystemSettings({ query: { queryKey } });
  const update = useAdminUpdateSystemSetting();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const refetch = () => qc.invalidateQueries({ queryKey });

  const save = (key: string, valueStr: string, description = "") => {
    if (!isSuperAdmin) return;
    let value: unknown = valueStr;
    try {
      value = JSON.parse(valueStr);
    } catch {
      // keep as string if not valid JSON
    }
    update.mutate(
      { data: { key, value: value as any, description } },
      {
        onSuccess: () => {
          toast({ title: t("admin.settings.saved", { defaultValue: "Saved" }) });
          refetch();
        },
        onError: (e: any) => {
          toast({
            title: e?.response?.data?.error || "Failed",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2 gap-1" data-testid="link-back-admin">
            <ChevronLeft className="h-4 w-4" /> {t("nav.admin")}
          </Button>
        </Link>
        {isSuperAdmin && (
          <span className="text-[10px] uppercase tracking-widest text-secondary font-bold flex items-center gap-1">
            <Crown className="h-3 w-3" /> Super-admin
          </span>
        )}
      </div>

      <h1 className="text-2xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" />
        {t("admin.settings.title", { defaultValue: "System Settings" })}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        {t("admin.settings.subtitle", {
          defaultValue: "Key-value configuration. Only super-admins can save changes.",
        })}
      </p>

      {isLoading && <div className="text-center text-muted-foreground py-8 text-sm">Loading…</div>}

      <ul className="space-y-3">
        {(settings ?? []).map((s) => (
          <SettingRow key={s.key} entry={s} onSave={save} canEdit={isSuperAdmin} />
        ))}
      </ul>

      {isSuperAdmin && (
        <div className="mt-6 bg-card border border-dashed border-border/60 rounded-2xl p-3 shadow-sm">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <Plus className="h-4 w-4" />
            {t("admin.settings.add", { defaultValue: "Add new setting" })}
          </h3>
          <div className="space-y-2">
            <Input
              placeholder="Key (e.g. feature.donate.enabled)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="rounded-full text-sm"
              data-testid="input-new-key"
            />
            <Textarea
              placeholder='Value (JSON or plain string), e.g. true, 42, "hello"'
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="rounded-2xl text-sm font-mono min-h-20"
              data-testid="input-new-value"
            />
            <Input
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="rounded-full text-sm"
              data-testid="input-new-desc"
            />
            <Button
              type="button"
              onClick={() => {
                if (!newKey.trim()) return;
                save(newKey.trim(), newValue, newDesc);
                setNewKey("");
                setNewValue("");
                setNewDesc("");
              }}
              className="w-full rounded-full"
              style={{ background: "var(--gold-gradient)" }}
              data-testid="button-save-new"
            >
              <Save className="h-4 w-4 mr-2" />
              Create setting
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingRow({
  entry,
  onSave,
  canEdit,
}: {
  entry: { key: string; value: unknown; description: string };
  onSave: (key: string, valueStr: string, desc: string) => void;
  canEdit: boolean;
}) {
  const [val, setVal] = useState(JSON.stringify(entry.value));
  return (
    <li className="bg-card border border-border/60 rounded-2xl p-3 shadow-sm" data-testid={`setting-row-${entry.key}`}>
      <div className="font-mono text-xs font-bold text-primary">{entry.key}</div>
      {entry.description && (
        <div className="text-[11px] text-muted-foreground mt-0.5">{entry.description}</div>
      )}
      <Textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={!canEdit}
        className="mt-2 rounded-xl text-xs font-mono min-h-16"
      />
      {canEdit && (
        <Button
          type="button"
          size="sm"
          onClick={() => onSave(entry.key, val, entry.description)}
          className="mt-2 rounded-full text-xs"
          variant="outline"
        >
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
      )}
    </li>
  );
}
