import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Users, TrendingUp, Database } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function AdminOverview() {
  const { t } = useI18n();
  const [stats, setStats] = useState({ total: 0, today: 0, reps: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [a, b, c] = await Promise.all([
        supabase.from("submissions").select("*", { count: "exact", head: true }),
        supabase.from("submissions").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("sales_reps").select("*", { count: "exact", head: true }),
      ]);
      setStats({ total: a.count ?? 0, today: b.count ?? 0, reps: c.count ?? 0 });
    })();
  }, []);

  const cards = [
    { label: t("totalSubmissions"), value: stats.total, icon: ClipboardList, color: "from-primary to-primary-glow" },
    { label: t("todaySubmissions"), value: stats.today, icon: TrendingUp, color: "from-accent to-accent" },
    { label: t("activeReps"), value: stats.reps, icon: Users, color: "from-secondary to-secondary" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminPanel")}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card key={c.label} className="overflow-hidden shadow-md hover:shadow-lg transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}>
                    <c.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="text-3xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/admin/submissions">
            <Card className="hover:shadow-lg transition-smooth cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> {t("submissions")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">View, filter and export all field submissions.</CardContent>
            </Card>
          </Link>
          <Link to="/admin/master-data">
            <Card className="hover:shadow-lg transition-smooth cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> {t("masterData")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Manage dropdown lists. Import from Excel.</CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
