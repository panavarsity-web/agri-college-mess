import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { buildDemoData, DEFAULT_SETTINGS } from "./demo-data";
import {
  ACTIVE_MONTH,
  daysInMonth,
  type AppData,
  type ExtraCharge,
  type Leave,
  type MonthKey,
  type Purchase,
  type ResidentialTutor,
  type Settings,
  type Staff,
  type Student,
} from "./types";

const STORAGE_KEY = "college-mess-demo-v1";

interface AppContextValue {
  data: AppData;
  month: MonthKey;
  ready: boolean;
  setMonth: (m: MonthKey) => void;
  addStudent: (student: Student) => { ok: boolean; error?: string };
  updateStudent: (id: string, patch: Partial<Student>) => void;
  setMessDays: (studentId: string, messDays: number) => void;
  addLeave: (leave: Omit<Leave, "id">) => void;
  addPurchase: (purchase: Omit<Purchase, "id">) => { ok: boolean; error?: string };
  deletePurchase: (id: string) => void;
  addExtra: (extra: Omit<ExtraCharge, "id">) => void;
  updateStaff: (id: string, patch: Partial<Staff>) => void;
  updateRT: (id: string, patch: Partial<ResidentialTutor>) => void;
  saveSettings: (settings: Settings) => void;
  resetRates: () => void;
  resetDemoData: () => void;
  restoreData: (raw: string) => void;
}

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __messAppContext?: React.Context<AppContextValue | null> };
const AppContext = g.__messAppContext ?? (g.__messAppContext = createContext<AppContextValue | null>(null));

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => buildDemoData());
  const [month, setMonth] = useState<MonthKey>(ACTIVE_MONTH);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved) as AppData);
    } catch {
      /* ignore unreadable local copy */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable */
    }
  }, [data, ready]);

  const value = useMemo<AppContextValue>(() => {
    const update = (fn: (d: AppData) => AppData) => setData((prev) => fn(prev));

    return {
      data,
      month,
      ready,
      setMonth,

      addStudent: (student) => {
        if (data.students.some((s) => s.id === student.id)) {
          return { ok: false, error: "A student with this ID already exists." };
        }
        update((d) => ({
          ...d,
          students: [...d.students, student],
          attendance: [
            ...d.attendance,
            ...(["2026-08", "2026-09", "2026-10"] as MonthKey[]).map((m) => ({
              month: m,
              studentId: student.id,
              messDays: daysInMonth(m),
            })),
          ],
        }));
        toast.success("Student added successfully.");
        return { ok: true };
      },

      updateStudent: (id, patch) => {
        update((d) => ({
          ...d,
          students: d.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));
        toast.success("Student updated.");
      },

      setMessDays: (studentId, messDays) => {
        update((d) => {
          const exists = d.attendance.some((a) => a.month === month && a.studentId === studentId);
          return {
            ...d,
            attendance: exists
              ? d.attendance.map((a) =>
                  a.month === month && a.studentId === studentId ? { ...a, messDays } : a,
                )
              : [...d.attendance, { month, studentId, messDays }],
          };
        });
      },

      addLeave: (leave) => {
        update((d) => {
          const current =
            d.attendance.find((a) => a.month === leave.month && a.studentId === leave.studentId)
              ?.messDays ?? 0;
          const messDays = Math.max(0, current - leave.days);
          return {
            ...d,
            leaves: [...d.leaves, { ...leave, id: `LV-${d.leaves.length + 1}` }],
            attendance: d.attendance.map((a) =>
              a.month === leave.month && a.studentId === leave.studentId ? { ...a, messDays } : a,
            ),
          };
        });
        toast.success("Leave recorded — mess days and bill updated.");
      },

      addPurchase: (purchase) => {
        const duplicate = data.purchases.some(
          (p) =>
            p.invoiceNo.toLowerCase() === purchase.invoiceNo.toLowerCase() &&
            p.supplier === purchase.supplier &&
            p.date === purchase.date,
        );
        if (duplicate) return { ok: false, error: "Duplicate invoice for this supplier and date." };
        update((d) => ({
          ...d,
          purchases: [{ ...purchase, id: `PUR-${Date.now()}` }, ...d.purchases],
        }));
        toast.success("Purchase saved.");
        return { ok: true };
      },

      deletePurchase: (id) => {
        update((d) => ({ ...d, purchases: d.purchases.filter((p) => p.id !== id) }));
        toast.success("Purchase removed.");
      },

      addExtra: (extra) => {
        update((d) => ({ ...d, extras: [...d.extras, { ...extra, id: `EX-${Date.now()}` }] }));
        toast.success("Extra charge added to the student's bill.");
      },

      updateStaff: (id, patch) => {
        update((d) => ({ ...d, staff: d.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
      },

      updateRT: (id, patch) => {
        update((d) => ({ ...d, rts: d.rts.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
      },

      saveSettings: (settings) => {
        update((d) => ({ ...d, settings }));
        toast.success("Settings updated — all calculations refreshed.");
      },

      resetRates: () => {
        update((d) => ({ ...d, settings: { ...DEFAULT_SETTINGS } }));
        toast.success("Demo rates restored.");
      },

      resetDemoData: () => {
        const fresh = buildDemoData();
        setData({ ...fresh, settings: data.settings });
        toast.success("Demo data reset. Configuration kept.");
      },

      restoreData: (raw) => {
        try {
          const parsed = JSON.parse(raw) as AppData;
          if (!parsed.students || !parsed.settings) throw new Error("bad file");
          setData(parsed);
          toast.success("Demo data restored from backup.");
        } catch {
          toast.error("That file could not be read as a demo backup.");
        }
      },
    };
  }, [data, month, ready]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
