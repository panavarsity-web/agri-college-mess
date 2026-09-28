import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  Info,
  LayoutGrid,
  Receipt,
  Search,
  Settings as SettingsIcon,
  ShoppingCart,
  UserCog,
  Users,
} from "lucide-react";

import { useApp } from "@/lib/store";
import { MONTHS, monthLabel, type MonthKey } from "@/lib/types";
import { calculateMonthlySummary, dataWarnings } from "@/lib/calc";
import { inrCompact } from "@/lib/money";
import { cn } from "@/lib/utils";
import { inputClass } from "./Panel";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/students", label: "Students", icon: Users },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/staff", label: "Staff & RT", icon: UserCog },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const BOTTOM_NAV = [
  { to: "/backup", label: "Backup", icon: Archive },
  { to: "/about", label: "About", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data, month, setMonth } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const summary = useMemo(() => calculateMonthlySummary(data, month), [data, month]);
  const warnings = useMemo(() => dataWarnings(data, month), [data, month]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const students = data.students
      .filter((s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((s) => ({
        type: "Student",
        name: s.name,
        id: s.id,
        to: `/students/${s.id}`,
      }));
    const purchases = data.purchases
      .filter(
        (p) =>
          p.invoiceNo.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q) ||
          p.item.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((p) => ({
        type: "Purchase",
        name: `${p.item} · ${p.supplier}`,
        id: p.invoiceNo,
        to: `/purchases?q=${encodeURIComponent(p.invoiceNo)}`,
      }));
    return [...students, ...purchases];
  }, [data, query]);

  return (
    <div className="min-h-screen w-full bg-ink text-ice font-body relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-24 size-[620px] rounded-full bg-brand/25 blur-3xl spin-slow" />
        <div className="absolute bottom-[-220px] right-[-120px] size-[560px] rounded-full bg-cyan/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 size-[360px] rounded-full bg-lime/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="w-64 shrink-0 glass p-5 flex flex-col gap-1 no-print">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-gradient-to-br from-brand to-cyan grid place-items-center font-display text-lg font-bold text-white">
              M
            </div>
            <div>
              <p className="font-display font-bold leading-none">College Mess</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ice/50">Management</p>
            </div>
          </Link>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                    active
                      ? "bg-white/10 text-white font-medium border border-white/10"
                      : "text-ice/60 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 pt-6">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-lime/10 border border-lime/25 text-[11px] text-lime">
              <span className="size-2 rounded-full bg-lime" /> Demo Mode
            </div>
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                    pathname.startsWith(item.to)
                      ? "bg-white/10 text-white"
                      : "text-ice/60 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}

            <div className="glass p-4 rounded-xl mt-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ice/40">Gross expense</p>
              <p className="font-display text-2xl font-bold tnum">
                {inrCompact(summary.grossExpenditure)}
              </p>
              <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-cyan"
                  style={{
                    width: `${Math.min(100, Math.round((summary.grossPurchases / Math.max(1, summary.grossExpenditure)) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-ice/50 mt-1.5">
                {inrCompact(summary.grossPurchases)} purchases · {monthLabel(month)}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="glass sticky top-0 z-20 px-8 py-4 flex items-center gap-4 no-print">
            <div>
              <p className="font-display text-xl font-bold leading-none">College Mess Management</p>
              <p className="text-[11px] text-ice/50 mt-0.5">
                Mess Billing &amp; Management System · {data.settings.hostelName}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value as MonthKey)}
                  className="bg-transparent px-3 py-1 text-sm font-medium font-display focus:outline-none [&>option]:bg-ink"
                  aria-label="Select month"
                >
                  {MONTHS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 w-72">
                  <Search className="size-4 text-ice/40 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search students, invoices, items…"
                    className="bg-transparent text-sm placeholder:text-ice/40 focus:outline-none w-full"
                  />
                </div>
                {results.length > 0 ? (
                  <div className="absolute right-0 mt-2 w-96 glass rounded-xl p-2 z-30 max-h-80 overflow-auto">
                    {results.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        type="button"
                        onClick={() => {
                          setQuery("");
                          navigate({ to: r.to });
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-3"
                      >
                        <span className="text-[10px] uppercase tracking-widest text-ice/40 w-16">
                          {r.type}
                        </span>
                        <span className="text-sm flex-1 truncate">{r.name}</span>
                        <span className="text-[11px] text-ice/50 tnum">{r.id}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold font-display bg-lime/15 text-lime border border-lime/30">
                DEMO MODE
              </span>

              <Link
                to="/settings"
                className="flex items-center gap-2 glass rounded-lg pl-2 pr-3 py-1.5"
                title={warnings.length ? `${warnings.length} data warning(s)` : "No data warnings"}
              >
                <span className="size-7 rounded-md bg-gradient-to-br from-brand to-cyan grid place-items-center text-[11px] font-semibold text-white">
                  DA
                </span>
                <span className="text-sm font-medium">Demo Admin</span>
                <ChevronDown className="size-3.5 text-ice/40" />
              </Link>
            </div>
          </header>

          <div className="p-8 space-y-6">
            <p className="text-[11px] text-ice/40 no-print">
              Demo data is for demonstration purposes only — not official college accounting data.
            </p>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
