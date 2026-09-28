/**
 * THE calculation engine. Dashboard, billing and reports all call these
 * functions — no screen may re-implement a formula.
 */
import { addMoney, mulMoney, pct, round2 } from "./money";
import {
  daysInMonth,
  type AppData,
  type ExtraCharge,
  type MonthKey,
  type Purchase,
  type PurchaseCategory,
  type ResidentialTutor,
  type Settings,
  type Staff,
  type Student,
} from "./types";

export function purchaseAmount(p: Purchase): number {
  return addMoney(mulMoney(p.quantity, p.rate), p.gst, p.delivery);
}

export function purchaseGross(p: Purchase): number {
  return mulMoney(p.quantity, p.rate);
}

export function monthPurchases(data: AppData, month: MonthKey): Purchase[] {
  return data.purchases.filter((p) => p.month === month);
}

export function categoryTotals(purchases: Purchase[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const p of purchases) {
    totals[p.category] = addMoney(totals[p.category] ?? 0, purchaseAmount(p));
  }
  return totals;
}

export function calculateGasCost(purchases: Purchase[], settings: Settings) {
  const gas = purchases.filter((p) => p.category === "Gas");
  const cylinders = gas.reduce((a, p) => a + p.quantity, 0);
  const gasCost = mulMoney(cylinders, settings.gasCylinderRate);
  const delivery = mulMoney(cylinders, settings.gasDeliveryRate);
  return { cylinders, gasCost, delivery, total: addMoney(gasCost, delivery) };
}

export function calculateEggCost(purchases: Purchase[], settings: Settings) {
  const eggs = purchases.filter((p) => p.category === "Egg");
  const count = eggs.reduce((a, p) => a + p.quantity, 0);
  const purchaseCost = eggs.reduce((a, p) => addMoney(a, purchaseAmount(p)), 0);
  const groceryAllocation = pct(purchaseCost, settings.eggAllocationPct);
  return { count, purchaseCost, groceryAllocation, total: addMoney(purchaseCost, groceryAllocation) };
}

export function calculateChickenCost(purchases: Purchase[], settings: Settings) {
  const items = purchases.filter((p) => p.category === "Chicken");
  const quantity = items.reduce((a, p) => a + p.quantity, 0);
  const purchaseCost = items.reduce((a, p) => addMoney(a, purchaseAmount(p)), 0);
  const groceryAllocation = pct(purchaseCost, settings.chickenAllocationPct);
  return { quantity, purchaseCost, groceryAllocation, total: addMoney(purchaseCost, groceryAllocation) };
}

export function billableDays(data: AppData, month: MonthKey, studentId: string): number {
  const record = data.attendance.find((a) => a.month === month && a.studentId === studentId);
  return record ? record.messDays : daysInMonth(month);
}

export function attendanceRow(data: AppData, month: MonthKey, student: Student) {
  const total = daysInMonth(month);
  const messDays = billableDays(data, month, student.id);
  return {
    student,
    totalDays: total,
    messDays,
    reduction: Math.max(0, total - messDays),
    billableDays: messDays,
  };
}

export function studentExtras(data: AppData, month: MonthKey, studentId: string): ExtraCharge[] {
  return data.extras.filter((e) => e.month === month && e.studentId === studentId);
}

export interface StudentBill {
  student: Student;
  days: number;
  dailyRate: number;
  baseMess: number;
  labour: number;
  establishment: number;
  electricity: number;
  extra: number;
  total: number;
}

export function calculateStudentBill(data: AppData, month: MonthKey, student: Student): StudentBill {
  const s = data.settings;
  const days = billableDays(data, month, student.id);
  const dayScholar = student.messStatus === "Day Scholar";
  const dailyRate = dayScholar ? s.dayScholarRate : s.messDailyRate;
  const baseMess = round2(days * dailyRate);
  const labour = dayScholar ? 0 : round2(s.labour);
  const establishment = dayScholar ? 0 : round2(s.establishment);
  const electricity = dayScholar ? 0 : round2(s.electricity);
  const extra = studentExtras(data, month, student.id).reduce((a, e) => addMoney(a, e.amount), 0);

  return {
    student,
    days,
    dailyRate,
    baseMess,
    labour,
    establishment,
    electricity,
    extra,
    total: addMoney(baseMess, labour, establishment, electricity, extra),
  };
}

export function calculateStudentBills(data: AppData, month: MonthKey): StudentBill[] {
  return data.students
    .filter((s) => s.status === "Active")
    .map((s) => calculateStudentBill(data, month, s));
}

export function calculateRTBill(rt: ResidentialTutor, settings: Settings) {
  const food = mulMoney(rt.days, settings.rtDailyRate);
  return {
    rt,
    days: rt.days,
    dailyRate: settings.rtDailyRate,
    food,
    extra: round2(rt.extra),
    labour: round2(settings.labour),
    electricity: round2(settings.electricity),
    total: addMoney(food, rt.extra, settings.labour, settings.electricity),
  };
}

export function calculateStaffBill(staff: Staff) {
  return { staff, total: addMoney(staff.food, staff.other) };
}

export function calculateManDays(data: AppData, month: MonthKey): number {
  return data.students
    .filter((s) => s.status === "Active" && s.messStatus === "Mess")
    .reduce((a, s) => a + billableDays(data, month, s.id), 0);
}

export function calculateLabourAllocation(data: AppData, month: MonthKey) {
  const heads = data.students.filter((s) => s.status === "Active" && s.messStatus === "Mess").length;
  const perHead = round2(data.settings.labour);
  void month;
  return { heads, perHead, total: round2(heads * perHead) };
}

export function calculateMonthlyExpense(data: AppData, month: MonthKey) {
  const purchases = monthPurchases(data, month);
  const byCategory = categoryTotals(purchases);
  const gross = purchases.reduce((a, p) => addMoney(a, purchaseAmount(p)), 0);
  return {
    purchases,
    byCategory,
    gross,
    gas: calculateGasCost(purchases, data.settings),
    egg: calculateEggCost(purchases, data.settings),
    chicken: calculateChickenCost(purchases, data.settings),
  };
}

export interface MonthlySummary {
  month: MonthKey;
  students: number;
  staff: number;
  rts: number;
  manDays: number;
  byCategory: Record<string, number>;
  grossPurchases: number;
  labour: number;
  establishment: number;
  electricity: number;
  grossExpenditure: number;
  staffRecovery: number;
  dayScholarRecovery: number;
  netExpenditure: number;
  costPerStudentDay: number;
  studentBillTotal: number;
  rtBillTotal: number;
}

export function calculateMonthlySummary(data: AppData, month: MonthKey): MonthlySummary {
  const expense = calculateMonthlyExpense(data, month);
  const active = data.students.filter((s) => s.status === "Active");
  const manDays = calculateManDays(data, month);
  const labour = calculateLabourAllocation(data, month).total;
  const messHeads = active.filter((s) => s.messStatus === "Mess").length;
  const establishment = round2(messHeads * data.settings.establishment);
  const electricity = round2(messHeads * data.settings.electricity);

  const grossExpenditure = addMoney(expense.gross, labour, establishment, electricity);
  const staffRecovery = data.staff.reduce((a, s) => addMoney(a, calculateStaffBill(s).total), 0);
  const dayScholarRecovery = active
    .filter((s) => s.messStatus === "Day Scholar")
    .reduce((a, s) => addMoney(a, calculateStudentBill(data, month, s).total), 0);
  const netExpenditure = round2(grossExpenditure - staffRecovery - dayScholarRecovery);

  return {
    month,
    students: active.length,
    staff: data.staff.length,
    rts: data.rts.length,
    manDays,
    byCategory: expense.byCategory,
    grossPurchases: expense.gross,
    labour,
    establishment,
    electricity,
    grossExpenditure,
    staffRecovery,
    dayScholarRecovery,
    netExpenditure,
    costPerStudentDay: manDays > 0 ? round2(netExpenditure / manDays) : 0,
    studentBillTotal: calculateStudentBills(data, month).reduce((a, b) => addMoney(a, b.total), 0),
    rtBillTotal: data.rts.reduce((a, rt) => addMoney(a, calculateRTBill(rt, data.settings).total), 0),
  };
}

export function batchSummary(data: AppData, month: MonthKey) {
  const rows = new Map<
    string,
    { batch: string; male: number; female: number; total: number; messDays: number; bills: number }
  >();

  for (const student of data.students.filter((s) => s.status === "Active")) {
    const row =
      rows.get(student.batch) ??
      { batch: student.batch, male: 0, female: 0, total: 0, messDays: 0, bills: 0 };
    if (student.gender === "Male") row.male += 1;
    else row.female += 1;
    row.total += 1;
    row.messDays += billableDays(data, month, student.id);
    row.bills = addMoney(row.bills, calculateStudentBill(data, month, student).total);
    rows.set(student.batch, row);
  }

  return [...rows.values()]
    .sort((a, b) => a.batch.localeCompare(b.batch))
    .map((r) => ({ ...r, averageDays: r.total ? round2(r.messDays / r.total) : 0 }));
}

export function dataWarnings(data: AppData, month: MonthKey): string[] {
  const warnings: string[] = [];
  const s = data.settings;
  if (!s.messDailyRate) warnings.push("Mess daily rate is not configured.");
  if (!s.labour) warnings.push("Labour rate is not configured.");

  const missing = data.students.filter(
    (st) => st.status === "Active" && !data.attendance.some((a) => a.month === month && a.studentId === st.id),
  );
  if (missing.length) warnings.push(`${missing.length} student(s) have no attendance for this month.`);

  const seen = new Set<string>();
  for (const p of monthPurchases(data, month)) {
    const key = `${p.supplier}|${p.date}|${p.invoiceNo}`;
    if (seen.has(key)) warnings.push(`Duplicate invoice ${p.invoiceNo} for ${p.supplier}.`);
    seen.add(key);
  }
  if (!monthPurchases(data, month).length) warnings.push("No purchases recorded for this month.");
  return warnings;
}

export function monthStatus(data: AppData, month: MonthKey) {
  const active = data.students.filter((s) => s.status === "Active");
  const attendanceDone = active.every((s) =>
    data.attendance.some((a) => a.month === month && a.studentId === s.id),
  );
  const purchases = monthPurchases(data, month);
  return [
    { label: "Student Data", ok: active.length > 0, note: `${active.length} active` },
    { label: "Attendance", ok: attendanceDone, note: attendanceDone ? "Complete" : "Incomplete" },
    { label: "Purchases", ok: purchases.length > 0, note: `${purchases.length} records` },
    {
      label: "Rates",
      ok: data.settings.messDailyRate > 0 && data.settings.labour > 0,
      note: "Configured",
    },
    { label: "Billing", ok: active.length > 0 && attendanceDone, note: "Calculated" },
    { label: "Reports", ok: purchases.length > 0 && attendanceDone, note: "Ready" },
  ];
}

export const CATEGORY_ACCENT: Record<PurchaseCategory | string, string> = {
  Grocery: "bg-brand",
  Vegetables: "bg-lime",
  Milk: "bg-cyan",
  Egg: "bg-amber",
  Chicken: "bg-rose",
  Gas: "bg-brand/70",
  Bakery: "bg-amber/70",
  "Ice Cream": "bg-cyan/70",
  Sanitary: "bg-lime/60",
  Other: "bg-ice/40",
};
