import {
  ACTIVE_MONTH,
  daysInMonth,
  type AppData,
  type Attendance,
  type Gender,
  type MonthKey,
  type Purchase,
  type PurchaseCategory,
  type Settings,
  type Student,
} from "./types";
import { round2 } from "./money";

export const DEFAULT_SETTINGS: Settings = {
  messDailyRate: 81.2967751531,
  labour: 462.1304347826,
  establishment: 250,
  electricity: 300,
  gasCylinderRate: 997,
  gasDeliveryRate: 40,
  rtDailyRate: 60,
  dayScholarRate: 60,
  eggAllocationPct: 50,
  chickenAllocationPct: 50,
  collegeName: "Demo Arts & Science College",
  hostelName: "Central Hostel",
  officeName: "Mess Office",
};

/* Deterministic pseudo-random so every launch shows the same demo figures. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const MALE_NAMES = [
  "ARUN KUMAR",
  "KARTHIK R",
  "VIGNESH S",
  "MOHAMMED RIYAS",
  "SURYA P",
  "HARIHARAN B",
  "NAVEEN RAJ",
  "ASHOK M",
  "PRAVEEN KUMAR",
  "DINESH V",
  "SANTHOSH K",
  "GOKUL RAJ",
  "BALAJI N",
  "ARAVIND S",
  "JEEVA M",
  "MANIKANDAN R",
  "SRIRAM T",
  "YUVARAJ P",
  "KISHORE K",
  "ANAND B",
  "RAGHUL S",
  "THARUN M",
  "VIMAL RAJ",
  "SATHISH N",
  "DHANUSH V",
  "AJAY KUMAR",
];

const FEMALE_NAMES = [
  "PRIYA S",
  "ANITHA M",
  "DEEPIKA R",
  "KAVIYA P",
  "SNEHA B",
  "MEENA K",
  "LAKSHMI N",
  "DIVYA S",
  "REVATHI M",
  "SWATHI R",
  "NANDHINI P",
  "ABIRAMI K",
  "HEMALATHA V",
  "JANANI S",
  "KEERTHANA M",
  "MADHUMITHA R",
  "POORNIMA N",
  "RAMYA K",
  "SARANYA P",
  "THAMIZH SELVI",
  "VAISHNAVI S",
  "YAZHINI M",
  "BHAVANI R",
  "CHITRA K",
];

const DEPARTMENTS = ["B.Sc Computer Science", "B.Com", "B.A. English", "B.Sc Maths", "BBA"];

/** Batch plan chosen so the Batch Summary report matches the demo brief. */
const BATCH_PLAN: { batch: string; male: number; female: number }[] = [
  { batch: "2023", male: 8, female: 6 },
  { batch: "2024", male: 7, female: 8 },
  { batch: "2025", male: 6, female: 5 },
  { batch: "2026", male: 5, female: 5 },
];

function buildStudents(): Student[] {
  const rand = rng(97);
  const students: Student[] = [];
  let maleIdx = 0;
  let femaleIdx = 0;
  let serial = 1;

  for (const plan of BATCH_PLAN) {
    const entries: Gender[] = [
      ...Array.from({ length: plan.male }, () => "Male" as Gender),
      ...Array.from({ length: plan.female }, () => "Female" as Gender),
    ];
    for (const gender of entries) {
      const name =
        (gender === "Male" ? MALE_NAMES[maleIdx++ % MALE_NAMES.length] : FEMALE_NAMES[femaleIdx++ % FEMALE_NAMES.length]) ?? "DEMO STUDENT";
      const id = `${plan.batch}01${String(serial).padStart(3, "0")}`;
      const dayScholar = serial % 17 === 0;
      students.push({
        id,
        name,
        batch: plan.batch,
        gender,
        department: DEPARTMENTS[Math.floor(rand() * DEPARTMENTS.length)] ?? DEPARTMENTS[0]!,
        hostel: gender === "Male" ? "Men's Hostel" : "Women's Hostel",
        room: `${gender === "Male" ? "M" : "W"}-${100 + Math.floor(rand() * 60)}`,
        messStatus: dayScholar ? "Day Scholar" : "Mess",
        admissionDate: `01-Jun-${plan.batch}`,
        status: "Active",
      });
      serial += 1;
    }
  }
  return students;
}

function buildAttendance(students: Student[]): Attendance[] {
  const rand = rng(31);
  const records: Attendance[] = [];
  const months: MonthKey[] = ["2026-08", "2026-09", "2026-10"];

  for (const month of months) {
    const total = daysInMonth(month);
    for (const student of students) {
      let messDays = total;
      if (month === ACTIVE_MONTH) {
        const roll = rand();
        if (roll > 0.82) messDays = total - 1;
        else if (roll > 0.94) messDays = total - 3;
      } else if (month === "2026-08") {
        messDays = total - (rand() > 0.7 ? 2 : 0);
      } else {
        messDays = Math.max(0, Math.round(total * 0.4));
      }
      records.push({ month, studentId: student.id, messDays });
    }
  }
  return records;
}

interface CategoryTarget {
  category: PurchaseCategory;
  target: number;
  records: number;
  items: string[];
  unit: string;
  supplier: string;
}

const CATEGORY_TARGETS: CategoryTarget[] = [
  {
    category: "Grocery",
    target: 400736,
    records: 12,
    items: ["Rice (Ponni)", "Toor Dal", "Sunflower Oil", "Sugar", "Wheat Flour", "Masala Set"],
    unit: "kg",
    supplier: "Sri Balaji Traders",
  },
  {
    category: "Vegetables",
    target: 248626,
    records: 12,
    items: ["Onion", "Tomato", "Potato", "Carrot", "Greens Bundle", "Drumstick"],
    unit: "kg",
    supplier: "Green Farm Vegetables",
  },
  {
    category: "Milk",
    target: 134640,
    records: 8,
    items: ["Toned Milk", "Curd Pack", "Butter Milk"],
    unit: "ltr",
    supplier: "Aavin Dairy Agency",
  },
  {
    category: "Chicken",
    target: 96400,
    records: 6,
    items: ["Broiler Chicken", "Chicken Curry Cut"],
    unit: "kg",
    supplier: "Fresh Cut Poultry",
  },
  {
    category: "Ice Cream",
    target: 16842,
    records: 3,
    items: ["Vanilla Family Pack", "Butterscotch Pack"],
    unit: "pack",
    supplier: "Cool Treats Distributors",
  },
  {
    category: "Bakery",
    target: 21500,
    records: 4,
    items: ["Bread Loaf", "Bun Pack", "Rusk"],
    unit: "pack",
    supplier: "Modern Bakery",
  },
  {
    category: "Sanitary",
    target: 12400,
    records: 3,
    items: ["Cleaning Liquid", "Detergent", "Phenyl"],
    unit: "ltr",
    supplier: "Clean Care Supplies",
  },
  {
    category: "Other",
    target: 9800,
    records: 3,
    items: ["Kitchen Utensils", "Water Can", "Repair Charges"],
    unit: "nos",
    supplier: "General Stores",
  },
];

function buildPurchases(settings: Settings): Purchase[] {
  const rand = rng(17);
  const purchases: Purchase[] = [];
  let invoice = 4100;

  const push = (p: Omit<Purchase, "id" | "month" | "status" | "remarks"> & { remarks?: string }) => {
    purchases.push({
      id: `PUR-${purchases.length + 1}`,
      month: ACTIVE_MONTH,
      status: purchases.length % 9 === 0 ? "Pending" : "Paid",
      remarks: p.remarks ?? "",
      ...p,
    });
  };

  for (const t of CATEGORY_TARGETS) {
    // split the target across records, then derive a realistic quantity + rate
    const weights = Array.from({ length: t.records }, () => 0.6 + rand());
    const weightSum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < t.records; i++) {
      const amount = round2((t.target * (weights[i] ?? 1)) / weightSum);
      const quantity = Math.max(1, Math.round(5 + rand() * 120));
      const rate = round2(amount / quantity);
      const day = Math.min(30, 2 + Math.floor((i * 30) / t.records) + Math.floor(rand() * 2));
      push({
        date: `${String(day).padStart(2, "0")}-Sep-2026`,
        invoiceNo: `INV-${invoice++}`,
        supplier: t.supplier,
        category: t.category,
        item: t.items[i % t.items.length] ?? t.items[0]!,
        quantity,
        unit: t.unit,
        rate,
        gst: 0,
        delivery: 0,
      });
    }
  }

  // Gas: 37 cylinders across 4 deliveries at cylinder rate + delivery charge
  [11, 8, 8, 10].forEach((cylinders, i) => {
    push({
      date: `${String(3 + i * 7).padStart(2, "0")}-Sep-2026`,
      invoiceNo: `GAS-${1180 + i}`,
      supplier: "Indane Gas Agency",
      category: "Gas",
      item: "Commercial LPG Cylinder",
      quantity: cylinders,
      unit: "cyl",
      rate: settings.gasCylinderRate,
      gst: 0,
      delivery: round2(cylinders * settings.gasDeliveryRate),
      remarks: `${cylinders} cylinders incl. delivery`,
    });
  });

  // Egg: 2,280 eggs = ₹14,472
  [
    { qty: 600, rate: 6.2, day: 4 },
    { qty: 1500, rate: 6.4, day: 14 },
    { qty: 180, rate: 6.4, day: 25 },
  ].forEach((e, i) => {
    push({
      date: `${String(e.day).padStart(2, "0")}-Sep-2026`,
      invoiceNo: `EGG-${2210 + i}`,
      supplier: "Namakkal Egg Traders",
      category: "Egg",
      item: "Table Egg",
      quantity: e.qty,
      unit: "nos",
      rate: e.rate,
      gst: 0,
      delivery: 0,
    });
  });

  return purchases;
}

export function buildDemoData(): AppData {
  const settings = { ...DEFAULT_SETTINGS };
  const students = buildStudents();

  return {
    settings,
    students,
    attendance: buildAttendance(students),
    leaves: [],
    purchases: buildPurchases(settings),
    staff: [
      { id: "STF-1", name: "RAMESH K", department: "Head Cook", days: 30, food: 2400, other: 800 },
      { id: "STF-2", name: "SELVI A", department: "Cook", days: 29, food: 2320, other: 600 },
      { id: "STF-3", name: "MURUGAN S", department: "Cook", days: 30, food: 2400, other: 600 },
      { id: "STF-4", name: "VALLI M", department: "Kitchen Helper", days: 28, food: 2240, other: 450 },
      { id: "STF-5", name: "KUMAR P", department: "Kitchen Helper", days: 30, food: 2400, other: 450 },
      { id: "STF-6", name: "SARASU R", department: "Cleaning", days: 27, food: 2160, other: 400 },
      { id: "STF-7", name: "PANDI V", department: "Store Keeper", days: 30, food: 2400, other: 700 },
      { id: "STF-8", name: "LATHA N", department: "Serving", days: 26, food: 2080, other: 400 },
    ],
    rts: [
      { id: "RT-1", name: "Dr. Ayyanduari", days: 25, extra: 0 },
      { id: "RT-2", name: "Dr. Sridevi", days: 12, extra: 0 },
      { id: "RT-3", name: "Dr. Vijiyapriya", days: 11, extra: 0 },
      { id: "RT-4", name: "Dr. Aishwarya", days: 13, extra: 0 },
    ],
    extras: [
      {
        id: "EX-1",
        month: ACTIVE_MONTH,
        studentId: "202301001",
        date: "12-Sep-2026",
        category: "Special Meal",
        amount: 120,
        reason: "Hostel day special dinner",
      },
      {
        id: "EX-2",
        month: ACTIVE_MONTH,
        studentId: "202301005",
        date: "18-Sep-2026",
        category: "Ice Cream",
        amount: 60,
        reason: "Sunday dessert",
      },
    ],
    suppliers: [
      { id: "SUP-1", name: "Sri Balaji Traders", category: "Grocery", phone: "98400 11221" },
      { id: "SUP-2", name: "Green Farm Vegetables", category: "Vegetables", phone: "98400 11222" },
      { id: "SUP-3", name: "Aavin Dairy Agency", category: "Milk", phone: "98400 11223" },
      { id: "SUP-4", name: "Namakkal Egg Traders", category: "Egg", phone: "98400 11224" },
      { id: "SUP-5", name: "Fresh Cut Poultry", category: "Chicken", phone: "98400 11225" },
      { id: "SUP-6", name: "Indane Gas Agency", category: "Gas", phone: "98400 11226" },
      { id: "SUP-7", name: "Modern Bakery", category: "Bakery", phone: "98400 11227" },
      { id: "SUP-8", name: "Cool Treats Distributors", category: "Ice Cream", phone: "98400 11228" },
    ],
  };
}
