import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Send, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  targetType: "destination" | "church";
  targetId: string;
};

export function ContributionSection({ targetType, targetId }: Props) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [reflection, setReflection] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Reset after a delay
    setTimeout(() => {
      setIsSuccess(false);
      setRating(0);
      setReflection("");
      setPhoto(null);
      setPreviewUrl(null);
    }, 3000);
  };

  return (
    <section className="mt-8 px-4 pb-8 max-w-2xl mx-auto">
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Camera className="h-24 w-24" />
        </div>

        <h3 className="text-xl font-serif font-bold text-foreground mb-1">
          {t("contributions.title", { defaultValue: "Share Your Pilgrimage" })}
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          {t("contributions.subtitle", { defaultValue: "Help fellow travelers by sharing your spiritual reflection and photos." })}
        </p>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold text-foreground">
                {t("contributions.success", { defaultValue: "Thank you for contributing!" })}
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                {t("contributions.moderation", { defaultValue: "Your reflection will be visible after review." })}
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Rating */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                  {t("contributions.rating", { defaultValue: "Spiritual Atmosphere" })}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={cn(
                        "p-1 transition-transform active:scale-90",
                        rating >= s ? "text-amber-500" : "text-muted-foreground/30"
                      )}
                    >
                      <Star className={cn("h-6 w-6", rating >= s && "fill-current")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                  {t("contributions.reflection", { defaultValue: "Your Reflection" })}
                </label>
                <Textarea
                  placeholder={t("contributions.placeholder", { defaultValue: "What touched your heart during this visit?" })}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="bg-muted/30 border-border/40 focus:border-primary/40 min-h-[100px] text-sm font-serif"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                  {t("contributions.photo", { defaultValue: "Add Photo" })}
                </label>
                <div className="flex gap-4 items-end">
                  <div 
                    onClick={() => document.getElementById("photo-upload")?.click()}
                    className={cn(
                      "w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors group overflow-hidden",
                      previewUrl ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1" />
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary">Upload</span>
                      </>
                    )}
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {previewUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        setPhoto(null);
                        setPreviewUrl(null);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-bold"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("contributions.submit", { defaultValue: "Submit Contribution" })}
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
