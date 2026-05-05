import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MapPin, CheckCircle2, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SearchableSelect, Option } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

const masterTables = ["sales_reps", "regions", "districts", "sectors", "territories", "sales_teams"] as const;
type MasterKey = typeof masterTables[number];

const schema = z.object({
  customer_name: z.string().trim().min(1).max(150),
  invoice_number: z.string().trim().min(1).max(60),
  address: z.string().trim().min(1).max(500),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{6,20}$/),
  sales_rep: z.string().min(1),
  region: z.string().min(1),
  district: z.string().min(1),
  sector: z.string().min(1),
  territory: z.string().min(1),
  sales_team: z.string().min(1),
});

export default function SalesForm() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [options, setOptions] = useState<Record<MasterKey, Option[]>>({
    sales_reps: [], regions: [], districts: [], sectors: [], territories: [], sales_teams: [],
  });
  const [form, setForm] = useState({
    customer_name: "", invoice_number: "", address: "", phone: "",
    sales_rep: "", region: "", district: "", sector: "", territory: "", sales_team: "",
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const results = await Promise.all(
        masterTables.map((tbl) => supabase.from(tbl).select("name").order("name"))
      );
      const next: any = {};
      masterTables.forEach((tbl, i) => {
        next[tbl] = (results[i].data ?? []).map((r: any) => ({ value: r.name, label: r.name }));
      });
      setOptions(next);
    })();
  }, []);

  function captureGps() {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success(t("gpsCaptured")); },
      (err) => { setLocating(false); toast.error(err.message || t("locationDenied")); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gps) { toast.error(t("captureGpsFirst")); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("submissions").insert({
      customer_name: parsed.data.customer_name!,
      invoice_number: parsed.data.invoice_number!,
      address: parsed.data.address!,
      phone: parsed.data.phone!,
      sales_rep: parsed.data.sales_rep,
      region: parsed.data.region,
      district: parsed.data.district,
      sector: parsed.data.sector,
      territory: parsed.data.territory,
      sales_team: parsed.data.sales_team,
      latitude: gps.lat,
      longitude: gps.lng,
      user_id: user!.id,
      device_info: navigator.userAgent.slice(0, 200),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("submissionSuccess"));
    setForm({ customer_name: "", invoice_number: "", address: "", phone: "", sales_rep: "", region: "", district: "", sector: "", territory: "", sales_team: "" });
    setGps(null);
  }

  const sel = (k: MasterKey, formKey: keyof typeof form) => (
    <div className="space-y-1.5">
      <Label>{t(formKey as any)}</Label>
      <SearchableSelect options={options[k]} value={form[formKey]} onChange={(v) => setForm({ ...form, [formKey]: v })} />
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("newSubmission")}</h1>
          <p className="text-sm text-muted-foreground">{t("fieldSalesSystem")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Card className="shadow-md border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {t("gpsLocation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gps ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div className="text-sm">
                      <div className="font-medium text-success">{t("gpsCaptured")}</div>
                      <div className="text-xs text-muted-foreground font-mono">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</div>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={captureGps}>↻</Button>
                </div>
              ) : (
                <Button type="button" onClick={captureGps} disabled={locating} className="w-full h-12 bg-gradient-primary shadow-md hover:shadow-glow transition-smooth animate-pulse-glow">
                  {locating ? <><Loader2 className="h-4 w-4 animate-spin me-2" /> {t("locating")}</> : <><MapPin className="h-4 w-4 me-2" /> {t("captureGps")}</>}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("customerName")}</Label>
                  <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("invoiceNumber")}</Label>
                  <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("address")}</Label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("phone")}</Label>
                <Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
              {sel("sales_reps", "sales_rep")}
              {sel("regions", "region")}
              {sel("districts", "district")}
              {sel("sectors", "sector")}
              {sel("territories", "territory")}
              {sel("sales_teams", "sales_team")}
            </CardContent>
          </Card>

          <Button type="submit" disabled={submitting} className="w-full h-12 bg-gradient-primary shadow-md hover:shadow-glow transition-smooth text-base font-semibold">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4 me-2" /> {t("submit")}</>}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
