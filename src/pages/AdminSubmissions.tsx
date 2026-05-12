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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

interface Sub {
  id: string;
  created_at: string;

  client_name: string;
  company_name: string;
  address: string;
  phone: string;

  district: string;
  region: string;
  sector_department: string;
  salesperson: string;
  sales_team: string;

  latitude: number;
  longitude: number;
}

export default function AdminSubmissions() {
  const { t } = useI18n();

  const [rows, setRows] = useState<Sub[]>([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    salesperson: "",
    region: "",
    district: "",
    sales_team: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error(error);
      setRows([]);
      return;
    }

    setRows((data as Sub[]) ?? []);
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.from && new Date(r.created_at) < new Date(filters.from)) {
        return false;
      }

      if (
        filters.to &&
        new Date(r.created_at) > new Date(filters.to + "T23:59:59")
      ) {
        return false;
      }

      if (filters.salesperson && r.salesperson !== filters.salesperson) {
        return false;
      }

      if (filters.region && r.region !== filters.region) {
        return false;
      }

      if (filters.district && r.district !== filters.district) {
        return false;
      }

      if (filters.sales_team && r.sales_team !== filters.sales_team) {
        return false;
      }

      return true;
    });
  }, [rows, filters]);

  const uniq = (key: keyof Sub) =>
    Array.from(
      new Set(rows.map((row) => row[key] as string).filter(Boolean))
    ).map((value) => ({
      value,
      label: value,
    }));

  function exportXlsx() {
    const data = filtered.map((r) => ({
      Timestamp: format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
      "Client Name": r.client_name,
      "Company Name": r.company_name,
      Phone: r.phone,
      Address: r.address,
      District: r.district,
      Region: r.region,
      "Sector / Department": r.sector_department,
      Salesperson: r.salesperson,
      "Sales Team": r.sales_team,
      Latitude: r.latitude,
      Longitude: r.longitude,
      "Google Maps": `https://www.google.com/maps?q=${r.latitude},${r.longitude}`,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Submissions");

    XLSX.writeFile(
      wb,
      `submissions-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`
    );
  }

  function clearFilters() {
    setFilters({
      from: "",
      to: "",
      salesperson: "",
      region: "",
      district: "",
      sales_team: "",
    });
  }

  const hasFilters =
    filters.from ||
    filters.to ||
    filters.salesperson ||
    filters.region ||
    filters.district ||
    filters.sales_team;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("submissions")}</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} / {rows.length}
            </p>
          </div>

          <Button
            onClick={exportXlsx}
            className="bg-gradient-primary shadow-md hover:shadow-glow transition-smooth"
          >
            <Download className="h-4 w-4 me-2" />
            {t("exportExcel")}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <FilterIcon className="h-4 w-4" />
              {t("filters")}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("dateFrom")}</Label>
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters({ ...filters, from: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t("dateTo")}</Label>
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters({ ...filters, to: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Salesperson</Label>
                <SearchableSelect
                  options={uniq("salesperson")}
                  value={filters.salesperson}
                  onChange={(value) =>
                    setFilters({ ...filters, salesperson: value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Region</Label>
                <SearchableSelect
                  options={uniq("region")}
                  value={filters.region}
                  onChange={(value) =>
                    setFilters({ ...filters, region: value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">District</Label>
                <SearchableSelect
                  options={uniq("district")}
                  value={filters.district}
                  onChange={(value) =>
                    setFilters({ ...filters, district: value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Sales Team</Label>
                <SearchableSelect
                  options={uniq("sales_team")}
                  value={filters.sales_team}
                  onChange={(value) =>
                    setFilters({ ...filters, sales_team: value })
                  }
                />
              </div>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Sector / Department</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Sales Team</TableHead>
                  <TableHead>Coordinates</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("noSubmissions")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(r.created_at), "yyyy-MM-dd HH:mm")}
                      </TableCell>

                      <TableCell className="font-medium">
                        {r.client_name}
                      </TableCell>

                      <TableCell>{r.company_name}</TableCell>

                      <TableCell className="font-mono text-xs">
                        {r.phone}
                      </TableCell>

                      <TableCell>{r.district}</TableCell>

                      <TableCell>{r.region}</TableCell>

                      <TableCell>{r.sector_department}</TableCell>

                      <TableCell>{r.salesperson}</TableCell>

                      <TableCell>{r.sales_team}</TableCell>

                      <TableCell>
                        <a
                          className="text-primary hover:underline text-xs font-mono"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                        >
                          {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
