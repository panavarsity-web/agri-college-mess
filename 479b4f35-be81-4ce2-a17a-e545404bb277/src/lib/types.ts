export type MonthKey = "2026-08" | "2026-09" | "2026-10";

export const MONTHS: { key: MonthKey; label: string; days: number }[] = [
  { key: "2026-08", label: "August 2026", days: 31 },
  { key: "2026-09", label: "September 2026", days: 30 },
  { key: "2026-10", label: "October 2026", days: 31 },
];

export const ACTIVE_MONTH: MonthKey = "2026-09";

export function monthLabel(key: MonthKey): string {
  return MONTHS.find((m) => m.key === key)?.label ?? key;
}

export function daysInMonth(key: MonthKey): number {
  return MONTHS.find((m) => m.key === key)?.days ?? 30;
}

export type Gender = "Male" | "Female";
export type MessStatus = "Mess" | "Day Scholar";
export type RecordStatus = "Active" | "Inactive";

export interface Student {
  id: string;
  name: string;
  batch: string;
  gender: Gender;
  department: string;
  hostel: string;
  room: string;
  messStatus: MessStatus;
  admissionDate: string;
  status: RecordStatus;
}

export interface Attendance {
  month: MonthKey;
  studentId: string;
  messDays: number;
}

export interface Leave {
  id: string;
  month: MonthKey;
  studentId: string;
  from: string;
  to: string;
  reason: string;
  days: number;
}

export const PURCHASE_CATEGORIES = [
  "Grocery",
  "Vegetables",
  "Milk",
  "Egg",
  "Chicken",
  "Gas",
  "Bakery",
  "Ice Cream",
  "Sanitary",
  "Other",
] as const;

export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number];

export interface Purchase {
  id: string;
  month: MonthKey;
  date: string;
  invoiceNo: string;
  supplier: string;
  category: PurchaseCategory;
  item: string;
  quantity: number;
  unit: string;
  rate: number;
  gst: number;
  delivery: number;
  remarks: string;
  status: "Paid" | "Pending";
}

export interface Staff {
  id: string;
  name: string;
  department: string;
  days: number;
  food: number;
  other: number;
}

export interface ResidentialTutor {
  id: string;
  name: string;
  days: number;
  extra: number;
}

export const EXTRA_CATEGORIES = [
  "Special Meal",
  "Ice Cream",
  "Guest Meal",
  "Additional Food",
  "Other",
] as const;

export type ExtraCategory = (typeof EXTRA_CATEGORIES)[number];

export interface ExtraCharge {
  id: string;
  month: MonthKey;
  studentId: string;
  date: string;
  category: ExtraCategory;
  amount: number;
  reason: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: PurchaseCategory;
  phone: string;
}

export interface Settings {
  messDailyRate: number;
  labour: number;
  establishment: number;
  electricity: number;
  gasCylinderRate: number;
  gasDeliveryRate: number;
  rtDailyRate: number;
  dayScholarRate: number;
  eggAllocationPct: number;
  chickenAllocationPct: number;
  collegeName: string;
  hostelName: string;
  officeName: string;
}

export interface AppData {
  students: Student[];
  attendance: Attendance[];
  leaves: Leave[];
  purchases: Purchase[];
  staff: Staff[];
  rts: ResidentialTutor[];
  extras: ExtraCharge[];
  suppliers: Supplier[];
  settings: Settings;
}
