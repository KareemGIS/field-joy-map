import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const tables = [
  { key: "sales_reps", labelKey: "salesRep" },
  { key: "regions", labelKey: "region" },
  { key: "districts", labelKey: "district" },
  { key: "sectors", labelKey: "sector" },
  { key: "sales_teams", labelKey: "salesTeam" },
] as const;

interface Row { id: string; name: string; code: string | null }

function MasterDataTable({ table }: { table: typeof tables[number]["key"] }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase.from(table).select("*").order("name");
    setRows((data as any) ?? []);
  }
  useEffect(() => { load(); }, [table]);

  async function add() {
    if (!newName.trim()) return;
    const { error } = await supabase.from(table).insert({ name: newName.trim(), code: newCode.trim() || null });
    if (error) toast.error(error.message); else { toast.success("Added"); setNewName(""); setNewCode(""); load(); }
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success(t("deleted")); load(); }
  }

  async function importExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(ws);
      const records = json
        .map((r) => ({ name: String(r.name ?? r.Name ?? "").trim(), code: r.code ?? r.Code ? String(r.code ?? r.Code).trim() : null }))
        .filter((r) => r.name);
      if (!records.length) { toast.error("No valid rows (need 'name' column)"); return; }
      const { error } = await supabase.from(table).upsert(records, { onConflict: "name" });
      if (error) toast.error(error.message);
      else { toast.success(`${records.length} ${t("rowsImported")}`); load(); }
    } finally { setLoading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="text-xs text-muted-foreground">{t("importInstructions")}</div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder={t("name")} value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 min-w-[180px]" />
            <Input placeholder={t("code")} value={newCode} onChange={(e) => setNewCode(e.target.value)} className="w-32" />
            <Button onClick={add} className="bg-gradient-primary"><Plus className="h-4 w-4 me-1" /> {t("addNew")}</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={importExcel} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Upload className="h-4 w-4 me-1" />} {t("importExcel")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>{t("name")}</TableHead><TableHead className="w-32">{t("code")}</TableHead><TableHead className="w-24 text-end">{t("actions")}</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs">{r.code ?? "—"}</TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function AdminMasterData() {
  const { t } = useI18n();
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{t("masterData")}</h1>
          <p className="text-sm text-muted-foreground">Manage dropdown lists used in the sales form.</p>
        </div>
        <Tabs defaultValue="sales_reps">
          <TabsList className="flex flex-wrap h-auto justify-start">
            {tables.map((tb) => (<TabsTrigger key={tb.key} value={tb.key}>{t(tb.labelKey as any)}</TabsTrigger>))}
          </TabsList>
          {tables.map((tb) => (
            <TabsContent key={tb.key} value={tb.key} className="mt-4"><MasterDataTable table={tb.key} /></TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}
