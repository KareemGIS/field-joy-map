import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      {lang === "en" ? "العربية" : "English"}
    </Button>
  );
}
