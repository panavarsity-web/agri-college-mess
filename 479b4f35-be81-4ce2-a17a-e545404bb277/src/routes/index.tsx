import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

import { useApp } from "@/lib/store";
import { monthLabel } from "@/lib/types";
import {
  CATEGORY_ACCENT,
  calculateMonthlySummary,
  calculateStudentBills,
  dataWarnings,
  monthStatus,
} from "@/lib/calc";
import { inr, inr0, inrCompact } from "@/lib/money";
import {
  Panel,
  PanelHeader,
  PageHeading,
  StatCard,
  Pill,
  btnGhost,
  btnPrimary,
  thClass,
  tdClass,
} from "@/components/mess/Panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mess Dashboard — College Mess Management" },
      {
        name: "description",
        content:
          "Live mess dashboard: student and staff counts, purchases, gross expense, cost per student per day and month close-out status.",
      },
      { property: "og:title", content: "Mess Dashboard — College Mess Management" },
      {
        property: "og:description",
        content: "Student counts, purchases, expenses and monthly mess billing status at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, month } = useApp();
  const navigate = useNavigate();

  const summary = useMemo(() => calculateMonthlySummary(data, month), [data, month]);
  const bills = useMemo(() => calculateStudentBills(data, month), [data, month]);
  const warnings = useMemo(() => dataWarnings(data, month), [data, month]);
  const status = useMemo(() => monthStatus(data, month), [data, month]);

  const categories = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = categories[0]?.[1] ?? 1;
  const pendingBills = data.purchases.filter((p) => p.month === month && p.status === "Pending").length;

  return (
    <>
      <PageHeading
        title="Mess Dashboard"
        subtitle={`${monthLabel(month)} · Manage students, attendance, purchases and monthly mess billing from one place.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={String(summary.students)}
          note={`${data.students.filter((s) => s.messStatus === "Day Scholar").length} day scholars`}
          onClick={() => navigate({ to: "/students" })}
        />
        <StatCard label="Staff" value={String(summary.staff)} note="Mess staff on roll" />
        <StatCard label="Residential Tutors" value={String(summary.rts)} note="RT mess accounts" />
        <StatCard
          label="Total Purchases"
          value={inr0(summary.grossPurchases)}
          note={`${data.purchases.filter((p) => p.month === month).length} vouchers`}
          tone="cyan"
          onClick={() => navigate({ to: "/purchases", search: {} })}
        />
        <StatCard
          label="Gross Mess Expense"
          value={inr0(summary.grossExpenditure)}
          note="Purchases + labour + establishment + electricity"
        />
        <StatCard
          label="Cost / Student / Day"
          value={inr(summary.costPerStudentDay)}
          note={`${summary.manDays} man days`}
          tone="lime"
        />
        <StatCard
          label="Pending Bills"
          value={String(pendingBills)}
          note={pendingBills ? "Unpaid purchase invoices" : "All settled"}
          tone={pendingBills ? "amber" : "lime"}
          onClick={() => navigate({ to: "/purchases", search: {} })}
        />
        <StatCard
          label="Data Warnings"
          value={String(warnings.length)}
          note={warnings[0] ?? "No issues found"}
          tone={warnings.length ? "rose" : "lime"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-6">
          <PanelHeader
            title="Expense breakdown"
            subtitle={`By category · ${monthLabel(month)}`}
            actions={<Pill tone="cyan">{inrCompact(summary.grossPurchases)} total</Pill>}
          />
          <div className="space-y-4">
            {categories.map(([category, amount]) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  navigate({ to: "/purchases", search: { category } })
                }
                className="w-full text-left group"
              >
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium group-hover:text-white">{category}</span>
                  <span className="text-ice/60 tnum">
                    {inr0(amount)} ·{" "}
                    {Math.round((amount / Math.max(1, summary.grossPurchases)) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_ACCENT[category] ?? "bg-brand"}`}
                    style={{ width: `${Math.max(3, Math.round((amount / maxCategory) * 100))}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-6 flex flex-col gap-3">
          <PanelHeader title="Quick actions" subtitle="Jump straight into the workflow" />
          <button className={btnPrimary} onClick={() => navigate({ to: "/students" })}>
            + Add student
          </button>
          <button className={btnGhost} onClick={() => navigate({ to: "/purchases", search: {} })}>
            + Add purchase
          </button>
          <button className={btnGhost} onClick={() => navigate({ to: "/attendance" })}>
            Mark attendance
          </button>
          <button className={btnGhost} onClick={() => navigate({ to: "/billing" })}>
            Generate bills
          </button>
          <button className={btnGhost} onClick={() => navigate({ to: "/reports" })}>
            Monthly summary
          </button>
          <div className="mt-auto pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-ice/50">
            <span className="size-2 rounded-full bg-lime" /> Billed total this month{" "}
            {inrCompact(summary.studentBillTotal)}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="p-6">
          <PanelHeader
            title="Month status"
            subtitle={`${monthLabel(month)} close-out · ${status.filter((s) => s.ok).length} of ${status.length} ready`}
          />
          <ul className="space-y-2.5 text-sm">
            {status.map((item) => (
              <li key={item.label} className="flex items-center gap-3">
                <span
                  className={`size-5 rounded-md grid place-items-center ${
                    item.ok ? "bg-lime/20 text-lime" : "bg-amber/20 text-amber"
                  }`}
                >
                  {item.ok ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <AlertTriangle className="size-3.5" />
                  )}
                </span>
                <span className="text-ice/80 flex-1">{item.label}</span>
                <span className="text-[11px] text-ice/45">{item.note}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="lg:col-span-2 p-6">
          <PanelHeader
            title="Students & billing"
            subtitle={`Highest bills · ${monthLabel(month)}`}
            actions={
              <button className="text-[11px] px-2.5 py-1 rounded-lg bg-brand/20 text-white font-medium" onClick={() => navigate({ to: "/billing" })}>
                Open billing
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>Student</th>
                  <th className={thClass}>Batch</th>
                  <th className={`${thClass} text-right`}>Days</th>
                  <th className={`${thClass} text-right`}>Base mess</th>
                  <th className={`${thClass} text-right`}>Total bill</th>
                  <th className={`${thClass} text-right`}>Mess status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...bills]
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 6)
                  .map((bill) => (
                    <tr
                      key={bill.student.id}
                      className="hover:bg-white/5 cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/students/$studentId",
                          params: { studentId: bill.student.id },
                        })
                      }
                    >
                      <td className={tdClass}>
                        <span className="font-medium">{bill.student.name}</span>
                        <span className="text-ice/40 text-[11px] ml-2 tnum">{bill.student.id}</span>
                      </td>
                      <td className={`${tdClass} text-ice/60`}>{bill.student.batch}</td>
                      <td className={`${tdClass} text-right tnum`}>{bill.days}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(bill.baseMess)}</td>
                      <td className={`${tdClass} text-right tnum font-display font-semibold`}>
                        {inr(bill.total)}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <Pill tone={bill.student.messStatus === "Mess" ? "lime" : "cyan"}>
                          {bill.student.messStatus}
                        </Pill>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
