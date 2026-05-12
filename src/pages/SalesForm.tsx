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

const masterTables = [
  "sales_reps",
  "regions",
  "districts",
  "sectors",
  "sales_teams",
] as const;

type MasterKey = typeof masterTables[number];

const schema = z.object({
  client_name: z.string().trim().min(1, "Client name is required").max(150),
  company_name: z.string().trim().min(1, "Company name is required").max(150),
  address: z.string().trim().min(1, "Address is required").max(500),
  district: z.string().min(1, "District is required"),
  region: z.string().min(1, "Region is required"),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{6,20}$/, "Invalid phone number"),
  sector_department: z.string().min(1, "Sector / Department is required"),
  salesperson: z.string().min(1, "Salesperson is required"),
  sales_team: z.string().min(1, "Sales team is required"),
});

const initialForm = {
  client_name: "",
  company_name: "",
  address: "",
  district: "",
  region: "",
  phone: "",
  sector_department: "",
  salesperson: "",
  sales_team: "",
};

export default function SalesForm() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [options, setOptions] = useState<Record<MasterKey, Option[]>>({
    sales_reps: [],
    regions: [],
    districts: [],
    sectors: [],
    sales_teams: [],
  });

  const [form, setForm] = useState(initialForm);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDropdowns() {
      const results = await Promise.all(
        masterTables.map((tableName) =>
          supabase.from(tableName).select("name").order("name")
        )
      );

      const next = {} as Record<MasterKey, Option[]>;

      masterTables.forEach((tableName, index) => {
        next[tableName] = (results[index].data ?? []).map((row: any) => ({
          value: row.name,
          label: row.name,
        }));
      });

      setOptions(next);
    }

    loadDropdowns();
  }, []);

  function captureGps() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setLocating(false);
        toast.success(t("gpsCaptured"));
      },
      (error) => {
        setLocating(false);
        toast.error(error.message || t("locationDenied"));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!user) {
      toast.error("You must be logged in first");
      return;
    }

    if (!gps) {
      toast.error(t("captureGpsFirst"));
      return;
    }

    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("submissions").insert({
      client_name: parsed.data.client_name,
      company_name: parsed.data.company_name,
      address: parsed.data.address,
      district: parsed.data.district,
      region: parsed.data.region,
      phone: parsed.data.phone,
      sector_department: parsed.data.sector_department,
      salesperson: parsed.data.salesperson,
      sales_team: parsed.data.sales_team,
      latitude: gps.lat,
      longitude: gps.lng,
      user_id: user.id,
      device_info: navigator.userAgent.slice(0, 200),
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("submissionSuccess"));
    setForm(initialForm);
    setGps(null);
  }

  const selectField = (
    tableName: MasterKey,
    formKey: keyof typeof form,
    label: string
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <SearchableSelect
        options={options[tableName]}
        value={form[formKey]}
        onChange={(value) => setForm({ ...form, [formKey]: value })}
      />
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
                <MapPin className="h-4 w-4 text-primary" />
                {t("gpsLocation")}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {gps ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div className="text-sm">
                      <div className="font-medium text-success">
                        {t("gpsCaptured")}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  <Button type="button" variant="ghost" size="sm" onClick={captureGps}>
                    ↻
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={captureGps}
                  disabled={locating}
                  className="w-full h-12 bg-gradient-primary shadow-md hover:shadow-glow transition-smooth animate-pulse-glow"
                >
                  {locating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("locating")}
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 me-2" />
                      {t("captureGps")}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Client Name</Label>
                  <Input
                    value={form.client_name}
                    onChange={(e) =>
                      setForm({ ...form, client_name: e.target.value })
                    }
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input
                    value={form.company_name}
                    onChange={(e) =>
                      setForm({ ...form, company_name: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
              {selectField("districts", "district", "District")}
              {selectField("regions", "region", "Region")}
              {selectField("sectors", "sector_department", "Sector / Department")}
              {selectField("sales_reps", "salesperson", "Salesperson")}
              {selectField("sales_teams", "sales_team", "Sales Team")}
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-gradient-primary shadow-md hover:shadow-glow transition-smooth text-base font-semibold"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 me-2" />
                {t("submit")}
              </>
            )}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
