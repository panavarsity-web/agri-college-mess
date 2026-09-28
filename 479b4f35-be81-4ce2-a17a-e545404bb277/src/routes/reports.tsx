import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useApp } from "@/lib/store";
import { daysInMonth, monthLabel } from "@/lib/types";
import {
  batchSummary,
  billableDays,
  calculateMonthlySummary,
  calculateStudentBills,
  monthPurchases,
  purchaseAmount,
} from "@/lib/calc";
import { addMoney, inr, inr0 } from "@/lib/money";
import { billRegisterPdf, exportExcel, monthlySummaryPdf } from "@/lib/exports";
import {
  Panel,
  PanelHeader,
  PageHeading,
  btnGhost,
  btnPrimary,
  btnSmall,
  thClass,
  tdClass,
} from "@/components/mess/Panel";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — College Mess Management" },
      {
        name: "description",
        content:
          "Monthly summary, student bills, purchase register, attendance and batch summary reports with print, PDF and Excel output.",
      },
      { property: "og:title", content: "Reports — College Mess Management" },
      {
        property: "og:description",
        content: "Monthly mess summary and registers ready to print or export.",
      },
    ],
  }),
  component: ReportsPage,
});

type ReportKey = "summary" | "bills" | "purchases" | "attendance" | "batch";

const REPORTS: { key: ReportKey; title: string; description: string }[] = [
  { key: "summary", title: "Monthly Summary", description: "Heads, expenditure, recoveries and cost per student per day" },
  { key: "bills", title: "Student Bills", description: "Bill register for every student with break-up" },
  { key: "purchases", title: "Purchase Register", description: "All supplier invoices for the month" },
  { key: "attendance", title: "Attendance", description: "Mess days and absent days per student" },
  { key: "batch", title: "Batch Summary", description: "Batch-wise strength, mess days and bill totals" },
];

function ReportsPage() {
  const { data, month } = useApp();
  const [active, setActive] = useState<ReportKey>("summary");

  const summary = useMemo(() => calculateMonthlySummary(data, month), [data, month]);
  const bills = useMemo(() => calculateStudentBills(data, month), [data, month]);
  const purchases = useMemo(() => monthPurchases(data, month), [data, month]);
  const batches = useMemo(() => batchSummary(data, month), [data, month]);
  const total = daysInMonth(month);

  const excelFor = (key: ReportKey) => {
    if (key === "summary") {
      return exportExcel(`Monthly-Summary-${month}`, [
        {
          name: "Monthly Summary",
          headers: ["Particulars", "Value"],
          rows: [
            ["Students", summary.students],
            ["Staff", summary.staff],
            ["Residential Tutors", summary.rts],
            ["Total Man Days", summary.manDays],
            ...Object.entries(summary.byCategory).map(([k, v]) => [k, v] as (string | number)[]),
            ["Total Purchases", summary.grossPurchases],
            ["Labour", summary.labour],
            ["Establishment", summary.establishment],
            ["Electricity", summary.electricity],
            ["Gross Expenditure", summary.grossExpenditure],
            ["Less Staff Recovery", summary.staffRecovery],
            ["Less Day Scholar Recovery", summary.dayScholarRecovery],
            ["Net Expenditure", summary.netExpenditure],
            ["Cost per Student per Day", summary.costPerStudentDay],
          ],
        },
      ]);
    }
    if (key === "bills") {
      return exportExcel(`Student-Bills-${month}`, [
        {
          name: "Student Bills",
          headers: ["Student ID", "Name", "Batch", "Days", "Base Mess", "Labour", "Establishment", "Electricity", "Extra", "Total"],
          rows: bills.map((b) => [
            b.student.id,
            b.student.name,
            b.student.batch,
            b.days,
            b.baseMess,
            b.labour,
            b.establishment,
            b.electricity,
            b.extra,
            b.total,
          ]),
        },
      ]);
    }
    if (key === "purchases") {
      return exportExcel(`Purchase-Register-${month}`, [
        {
          name: "Purchases",
          headers: ["Date", "Invoice", "Supplier", "Category", "Item", "Quantity", "Unit", "Rate", "GST", "Delivery", "Total", "Status"],
          rows: purchases.map((p) => [
            p.date,
            p.invoiceNo,
            p.supplier,
            p.category,
            p.item,
            p.quantity,
            p.unit,
            p.rate,
            p.gst,
            p.delivery,
            purchaseAmount(p),
            p.status,
          ]),
        },
      ]);
    }
    if (key === "attendance") {
      return exportExcel(`Attendance-${month}`, [
        {
          name: "Attendance",
          headers: ["Student ID", "Name", "Batch", "Mess Days", "Absent Days"],
          rows: data.students.map((s) => [
            s.id,
            s.name,
            s.batch,
            billableDays(data, month, s.id),
            total - billableDays(data, month, s.id),
          ]),
        },
      ]);
    }
    return exportExcel(`Batch-Summary-${month}`, [
      {
        name: "Batch Summary",
        headers: ["Batch", "Male", "Female", "Total", "Mess Days", "Average Days", "Total Bills"],
        rows: batches.map((b) => [b.batch, b.male, b.female, b.total, b.messDays, b.averageDays, b.bills]),
      },
    ]);
  };

  const pdfFor = (key: ReportKey) => {
    if (key === "bills") return billRegisterPdf(bills, month, data.settings);
    return monthlySummaryPdf(summary, month, data.settings);
  };

  return (
    <>
      <PageHeading
        title="Reports"
        subtitle={`${monthLabel(month)} · every figure is calculated live from students, attendance, purchases and rates`}
        actions={
          <>
            <button className={btnGhost} onClick={() => window.print()}>
              Print
            </button>
            <button className={btnPrimary} onClick={() => pdfFor(active)}>
              Export PDF
            </button>
            <button
              className={btnGhost}
              onClick={() => excelFor(active).then(() => toast.success("Report exported to Excel."))}
            >
              Export Excel
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setActive(r.key)}
            className={`glass rounded-2xl p-4 text-left transition hover:border-white/25 ${
              active === r.key ? "border-brand/60" : ""
            }`}
          >
            <p className="font-display text-sm font-semibold">{r.title}</p>
            <p className="text-[11px] text-ice/50 mt-1 leading-relaxed">{r.description}</p>
            <div className="flex gap-1.5 mt-3">
              <span className={btnSmall}>View</span>
            </div>
          </button>
        ))}
      </div>

      <Panel className="p-6 print-area">
        {active === "summary" ? (
          <>
            <PanelHeader title="Monthly Summary" subtitle={monthLabel(month)} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  <Row label="Students" value={String(summary.students)} />
                  <Row label="Staff" value={String(summary.staff)} />
                  <Row label="Residential tutors" value={String(summary.rts)} />
                  <Row label="Total man days" value={String(summary.manDays)} />
                  {Object.entries(summary.byCategory).map(([k, v]) => (
                    <Row key={k} label={k} value={inr(v)} />
                  ))}
                </tbody>
              </table>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  <Row label="Total purchases" value={inr(summary.grossPurchases)} />
                  <Row label="Labour" value={inr(summary.labour)} />
                  <Row label="Establishment" value={inr(summary.establishment)} />
                  <Row label="Electricity" value={inr(summary.electricity)} />
                  <Row label="Gross expenditure" value={inr(summary.grossExpenditure)} strong />
                  <Row label="Less: staff recovery" value={inr(summary.staffRecovery)} />
                  <Row label="Less: day scholar recovery" value={inr(summary.dayScholarRecovery)} />
                  <Row label="Net expenditure" value={inr(summary.netExpenditure)} strong />
                  <Row label="Cost / student / day" value={inr(summary.costPerStudentDay)} strong />
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {active === "bills" ? (
          <>
            <PanelHeader
              title="Student Bills"
              subtitle={`${bills.length} students · ${inr0(bills.reduce((a, b) => addMoney(a, b.total), 0))} total`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={thClass}>Student ID</th>
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Batch</th>
                    <th className={`${thClass} text-right`}>Days</th>
                    <th className={`${thClass} text-right`}>Base mess</th>
                    <th className={`${thClass} text-right`}>Extra</th>
                    <th className={`${thClass} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bills.map((b) => (
                    <tr key={b.student.id}>
                      <td className={`${tdClass} tnum text-ice/60`}>{b.student.id}</td>
                      <td className={`${tdClass} font-medium`}>{b.student.name}</td>
                      <td className={tdClass}>{b.student.batch}</td>
                      <td className={`${tdClass} text-right tnum`}>{b.days}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.baseMess)}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.extra)}</td>
                      <td className={`${tdClass} text-right tnum font-display font-semibold`}>
                        {inr(b.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {active === "purchases" ? (
          <>
            <PanelHeader
              title="Purchase Register"
              subtitle={`${purchases.length} invoices · ${inr0(summary.grossPurchases)}`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Invoice</th>
                    <th className={thClass}>Supplier</th>
                    <th className={thClass}>Category</th>
                    <th className={thClass}>Item</th>
                    <th className={`${thClass} text-right`}>Qty</th>
                    <th className={`${thClass} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className={`${tdClass} text-ice/60`}>{p.date}</td>
                      <td className={`${tdClass} tnum text-ice/60`}>{p.invoiceNo}</td>
                      <td className={tdClass}>{p.supplier}</td>
                      <td className={tdClass}>{p.category}</td>
                      <td className={`${tdClass} font-medium`}>{p.item}</td>
                      <td className={`${tdClass} text-right tnum`}>
                        {p.quantity} {p.unit}
                      </td>
                      <td className={`${tdClass} text-right tnum font-display`}>
                        {inr(purchaseAmount(p))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {active === "attendance" ? (
          <>
            <PanelHeader title="Attendance" subtitle={`${monthLabel(month)} · ${total} calendar days`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={thClass}>Student ID</th>
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Batch</th>
                    <th className={`${thClass} text-right`}>Mess days</th>
                    <th className={`${thClass} text-right`}>Absent days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.students.map((s) => {
                    const days = billableDays(data, month, s.id);
                    return (
                      <tr key={s.id}>
                        <td className={`${tdClass} tnum text-ice/60`}>{s.id}</td>
                        <td className={`${tdClass} font-medium`}>{s.name}</td>
                        <td className={tdClass}>{s.batch}</td>
                        <td className={`${tdClass} text-right tnum`}>{days}</td>
                        <td className={`${tdClass} text-right tnum`}>{total - days}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {active === "batch" ? (
          <>
            <PanelHeader title="Batch Summary" subtitle={monthLabel(month)} />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>Batch</th>
                  <th className={`${thClass} text-right`}>Male</th>
                  <th className={`${thClass} text-right`}>Female</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={`${thClass} text-right`}>Mess days</th>
                  <th className={`${thClass} text-right`}>Average days</th>
                  <th className={`${thClass} text-right`}>Total bills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {batches.map((b) => (
                  <tr key={b.batch}>
                    <td className={`${tdClass} font-medium`}>{b.batch}</td>
                    <td className={`${tdClass} text-right tnum`}>{b.male}</td>
                    <td className={`${tdClass} text-right tnum`}>{b.female}</td>
                    <td className={`${tdClass} text-right tnum`}>{b.total}</td>
                    <td className={`${tdClass} text-right tnum`}>{b.messDays}</td>
                    <td className={`${tdClass} text-right tnum`}>{b.averageDays}</td>
                    <td className={`${tdClass} text-right tnum font-display`}>{inr(b.bills)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        <p className="text-[11px] text-ice/40 mt-6">Demo Version — for demonstration purposes only.</p>
      </Panel>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr>
      <td className={`py-2.5 ${strong ? "font-display font-semibold" : "text-ice/70"}`}>{label}</td>
      <td className={`py-2.5 text-right tnum ${strong ? "font-display font-semibold" : ""}`}>
        {value}
      </td>
    </tr>
  );
}
