import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { 
  ChevronLeft, 
  Plus, 
  Search, 
  BookOpen,
  Edit2,
  Trash2,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminPrayers() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  return (
    <div className="p-4 pb-24 bg-background min-h-full">
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2 gap-1">
            <ChevronLeft className="h-4 w-4" /> {t("nav.admin")}
          </Button>
        </Link>
        <Button size="sm" className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> {t("admin.addNew")}
        </Button>
      </div>

      <h1 className="text-2xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        {t("admin.prayers.title")}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t("admin.prayers.subtitle")}
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search prayers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 rounded-full h-10 text-sm"
        />
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-8 text-center text-muted-foreground italic text-sm">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
          {t("admin.prayers.empty")}
        </div>
      </div>
    </div>
  );
}
