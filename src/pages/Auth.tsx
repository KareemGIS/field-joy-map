import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});
const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1).max(100),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  useEffect(() => {
    if (!loading && user) nav("/");
  }, [user, loading, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email!,
          password: parsed.data.password!,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.data.fullName },
          },
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Account created");
      } else {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email!, password: parsed.data.password! });
        if (error) { toast.error(error.message); return; }
        toast.success("Signed in");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4"><LanguageToggle /></div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary-foreground/10 backdrop-blur-md items-center justify-center mb-3 shadow-lg">
            <MapPin className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">{t("appName")}</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">{t("appTagline")}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{mode === "signin" ? t("signIn") : t("createAccount")}</CardTitle>
            <CardDescription>{t("welcomeBack")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label>{t("fullName")}</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>{t("email")}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("password")}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11" />
              </div>
              <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-primary shadow-md hover:shadow-glow transition-smooth">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "signin" ? t("signIn") : t("createAccount"))}
              </Button>
            </form>
            <div className="text-center text-sm text-muted-foreground mt-4">
              {mode === "signin" ? t("noAccount") : t("haveAccount")}{" "}
              <button className="text-primary font-medium hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                {mode === "signin" ? t("signUp") : t("signIn")}
              </button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-primary-foreground/70 mt-4">First registered user becomes admin.</p>
      </div>
    </div>
  );
}
