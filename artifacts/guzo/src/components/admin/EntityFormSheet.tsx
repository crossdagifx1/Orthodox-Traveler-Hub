import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Schema-driven create/edit form sheet used by every Admin* page.
 *
 * Why this exists: each admin list page (Destinations, Churches, Mezmurs,
 * News, Marketplace) has a "New" / "Edit" button. Hand-rolling five forms
 * with identical patterns is wasteful, so this component takes a list of
 * field descriptors + a submit handler and renders the matching inputs.
 */

export type EntityFieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "checkbox";

export type EntityField = {
  key: string;
  label: string;
  type?: EntityFieldType;
  placeholder?: string;
  required?: boolean;
  /** For number fields, optional default. */
  defaultValue?: string | number | boolean;
  /** Hint shown under the input. */
  hint?: string;
};

export type EntityFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel?: string;
  fields: EntityField[];
  /** Initial values for edit mode. */
  initialValues?: Record<string, unknown>;
  /** Called with cleaned values; should call the mutation. Throw to surface error toast. */
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  isPending?: boolean;
};

function buildInitialState(
  fields: EntityField[],
  initial?: Record<string, unknown>,
): Record<string, string | boolean> {
  const state: Record<string, string | boolean> = {};
  for (const f of fields) {
    const initialValue = initial?.[f.key];
    if (f.type === "checkbox") {
      state[f.key] =
        typeof initialValue === "boolean"
          ? initialValue
          : Boolean(f.defaultValue ?? false);
    } else if (initialValue === undefined || initialValue === null) {
      state[f.key] =
        f.defaultValue !== undefined ? String(f.defaultValue) : "";
    } else {
      state[f.key] = String(initialValue);
    }
  }
  return state;
}

export function EntityFormSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Save",
  fields,
  initialValues,
  onSubmit,
  isPending,
}: EntityFormSheetProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    buildInitialState(fields, initialValues),
  );
  const [submitting, setSubmitting] = useState(false);

  // Reset form whenever the sheet opens with fresh initial values.
  useEffect(() => {
    if (open) setValues(buildInitialState(fields, initialValues));
  }, [open, fields, initialValues]);

  const isWorking = submitting || !!isPending;

  const handleChange = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWorking) return;

    // Validate required + coerce types.
    const cleaned: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.key];
      if (f.type === "checkbox") {
        cleaned[f.key] = Boolean(raw);
        continue;
      }
      const str = typeof raw === "string" ? raw.trim() : "";
      if (!str) {
        if (f.required) {
          toast({
            title: "Missing required field",
            description: f.label,
            variant: "destructive",
          });
          return;
        }
        // Skip empty optional fields entirely so the API receives undefined.
        continue;
      }
      if (f.type === "number") {
        const n = Number(str);
        if (Number.isNaN(n)) {
          toast({
            title: "Invalid number",
            description: f.label,
            variant: "destructive",
          });
          return;
        }
        cleaned[f.key] = n;
      } else {
        cleaned[f.key] = str;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(cleaned);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] max-w-[100vw] overflow-y-auto"
        data-testid="sheet-entity-form"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl text-primary">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {fields.map((field) => {
            const id = `field-${field.key}`;
            const value = values[field.key];
            if (field.type === "checkbox") {
              return (
                <label
                  key={field.key}
                  htmlFor={id}
                  className="flex items-center gap-2 text-sm select-none cursor-pointer"
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => handleChange(field.key, e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    data-testid={`input-${field.key}`}
                  />
                  <span>{field.label}</span>
                </label>
              );
            }
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={id} className="text-xs uppercase tracking-wide">
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={id}
                    placeholder={field.placeholder}
                    value={String(value ?? "")}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    rows={4}
                    data-testid={`input-${field.key}`}
                  />
                ) : (
                  <Input
                    id={id}
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "url"
                          ? "url"
                          : "text"
                    }
                    placeholder={field.placeholder}
                    value={String(value ?? "")}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    data-testid={`input-${field.key}`}
                  />
                )}
                {field.hint && (
                  <p className="text-[11px] text-muted-foreground">{field.hint}</p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isWorking}
              data-testid="button-form-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full"
              disabled={isWorking}
              data-testid="button-form-submit"
            >
              {isWorking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
