import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Filter as FilterIcon } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

interface Sub {
  id: string; created_at: string; customer_name: string; invoice_number: string; address: string; phone: string;
  latitude: number; longitude: number; sales_rep: string; region: string; district: string; sector: string;
  territory: string; sales_team: string;
}

export default function AdminSubmissions() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Sub[]>([]);
  const [filters, setFilters] = useState({ from: "", to: "", sales_rep: "", region: "", territory: "" });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from("submissions").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows((data as any) ?? []);
  }

  const filtered = useMemo(() => rows.filter((r) => {
    if (filters.from && new Date(r.created_at) < new Date(filters.from)) return false;
    if (filters.to && new Date(r.created_at) > new Date(filters.to + "T23:59:59")) return false;
    if (filters.sales_rep && r.sales_rep !== filters.sales_rep) return false;
    if (filters.region && r.region !== filters.region) return false;
    if (filters.territory && r.territory !== filters.territory) return false;
    return true;
  }), [rows, filters]);

  const uniq = (k: keyof Sub) => Array.from(new Set(rows.map((r) => r[k] as string).filter(Boolean))).map((v) => ({ value: v, label: v }));

  function exportXlsx() {
    const data = filtered.map((r) => ({
      [t("timestamp")]: format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
      [t("customerName")]: r.customer_name,
      [t("invoiceNumber")]: r.invoice_number,
      [t("phone")]: r.phone,
      [t("address")]: r.address,
      Latitude: r.latitude, Longitude: r.longitude,
      [t("salesRep")]: r.sales_rep, [t("region")]: r.region, [t("district")]: r.district,
      [t("sector")]: r.sector, [t("territory")]: r.territory, [t("salesTeam")]: r.sales_team,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `submissions-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("submissions")}</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} / {rows.length}</p>
          </div>
          <Button onClick={exportXlsx} className="bg-gradient-primary shadow-md hover:shadow-glow transition-smooth">
            <Download className="h-4 w-4 me-2" /> {t("exportExcel")}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <FilterIcon className="h-4 w-4" /> {t("filters")}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1"><Label className="text-xs">{t("dateFrom")}</Label><Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t("dateTo")}</Label><Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t("salesRep")}</Label><SearchableSelect options={uniq("sales_rep")} value={filters.sales_rep} onChange={(v) => setFilters({ ...filters, sales_rep: v })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t("region")}</Label><SearchableSelect options={uniq("region")} value={filters.region} onChange={(v) => setFilters({ ...filters, region: v })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t("territory")}</Label><SearchableSelect options={uniq("territory")} value={filters.territory} onChange={(v) => setFilters({ ...filters, territory: v })} /></div>
            </div>
            {(filters.from || filters.to || filters.sales_rep || filters.region || filters.territory) && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setFilters({ from: "", to: "", sales_rep: "", region: "", territory: "" })}>Clear filters</Button>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("timestamp")}</TableHead>
                  <TableHead>{t("customerName")}</TableHead>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead>{t("salesRep")}</TableHead>
                  <TableHead>{t("region")}</TableHead>
                  <TableHead>{t("territory")}</TableHead>
                  <TableHead>{t("coordinates")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t("noSubmissions")}</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell className="font-medium">{r.customer_name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.invoice_number}</TableCell>
                    <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                    <TableCell>{r.sales_rep}</TableCell>
                    <TableCell>{r.region}</TableCell>
                    <TableCell>{r.territory}</TableCell>
                    <TableCell>
                      <a className="text-primary hover:underline text-xs font-mono" target="_blank" rel="noopener" href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}>
                        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
