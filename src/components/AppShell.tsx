import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Database, FileText, LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();

  const adminLinks = [
    { to: "/admin", label: t("overview"), icon: LayoutDashboard },
    { to: "/admin/submissions", label: t("submissions"), icon: ClipboardList },
    { to: "/admin/master-data", label: t("masterData"), icon: Database },
    { to: "/", label: t("salesForm"), icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b shadow-sm">
        <div className="container flex items-center justify-between h-16 gap-4">
          <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-smooth">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm leading-tight">{t("appName")}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{t("appTagline")}</div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <LanguageToggle />
            {user && (
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/auth"); }} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("signOut")}</span>
              </Button>
            )}
          </div>
        </div>

        {isAdmin && (
          <nav className="container flex gap-1 overflow-x-auto pb-2 -mt-1">
            {adminLinks.map((l) => {
              const active = loc.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-smooth",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="container py-6 animate-fade-in">{children}</main>
    </div>
  );
}
