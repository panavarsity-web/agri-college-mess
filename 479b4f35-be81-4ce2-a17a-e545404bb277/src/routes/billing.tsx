import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useApp } from "@/lib/store";
import { monthLabel } from "@/lib/types";
import {
  calculateRTBill,
  calculateStaffBill,
  calculateStudentBills,
  type StudentBill,
} from "@/lib/calc";
import { addMoney, inr, inr0 } from "@/lib/money";
import { billRegisterPdf, exportExcel, studentBillPdf } from "@/lib/exports";
import {
  Panel,
  PageHeading,
  StatCard,
  Pill,
  Field,
  btnGhost,
  btnPrimary,
  btnSmall,
  inputClass,
  thClass,
  tdClass,
} from "@/components/mess/Panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing — College Mess Management" },
      {
        name: "description",
        content:
          "Calculate student, staff and residential tutor mess bills, then print or export them as PDF and Excel.",
      },
      { property: "og:title", content: "Billing — College Mess Management" },
      {
        property: "og:description",
        content: "Monthly mess bills for students, staff and residential tutors.",
      },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { data, month } = useApp();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<StudentBill | null>(null);

  const bills = useMemo(() => calculateStudentBills(data, month), [data, month]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter(
      (b) => !q || b.student.name.toLowerCase().includes(q) || b.student.id.includes(q),
    );
  }, [bills, search]);

  const studentTotal = bills.reduce((a, b) => addMoney(a, b.total), 0);
  const staffBills = data.staff.map(calculateStaffBill);
  const staffTotal = staffBills.reduce((a, b) => addMoney(a, b.total), 0);
  const rtBills = data.rts.map((rt) => calculateRTBill(rt, data.settings));
  const rtTotal = rtBills.reduce((a, b) => addMoney(a, b.total), 0);

  return (
    <>
      <PageHeading
        title="Billing"
        subtitle={`${monthLabel(month)} · bills recalculate automatically from attendance, rates and extras`}
        actions={
          <>
            <button
              className={btnPrimary}
              onClick={() =>
                toast.success(
                  `Bills calculated for ${bills.length} students · ${inr0(studentTotal)} total.`,
                )
              }
            >
              Calculate bills
            </button>
            <button
              className={btnGhost}
              onClick={() => billRegisterPdf(bills, month, data.settings)}
            >
              Generate PDF
            </button>
            <button
              className={btnGhost}
              onClick={() =>
                exportExcel(`Bills-${month}`, [
                  {
                    name: "Student Bills",
                    headers: [
                      "Student ID",
                      "Name",
                      "Batch",
                      "Days",
                      "Daily Rate",
                      "Base Mess",
                      "Labour",
                      "Establishment",
                      "Electricity",
                      "Extra",
                      "Total",
                    ],
                    rows: bills.map((b) => [
                      b.student.id,
                      b.student.name,
                      b.student.batch,
                      b.days,
                      b.dailyRate,
                      b.baseMess,
                      b.labour,
                      b.establishment,
                      b.electricity,
                      b.extra,
                      b.total,
                    ]),
                  },
                  {
                    name: "Staff Bills",
                    headers: ["Staff ID", "Name", "Department", "Days", "Food", "Other", "Total"],
                    rows: staffBills.map((b) => [
                      b.staff.id,
                      b.staff.name,
                      b.staff.department,
                      b.staff.days,
                      b.staff.food,
                      b.staff.other,
                      b.total,
                    ]),
                  },
                  {
                    name: "RT Bills",
                    headers: ["RT ID", "Name", "Days", "Daily Rate", "Food", "Labour", "Electricity", "Extra", "Total"],
                    rows: rtBills.map((b) => [
                      b.rt.id,
                      b.rt.name,
                      b.days,
                      b.dailyRate,
                      b.food,
                      b.labour,
                      b.electricity,
                      b.extra,
                      b.total,
                    ]),
                  },
                ]).then(() => toast.success("Bills exported to Excel."))
              }
            >
              Export Excel
            </button>
            <button className={btnGhost} onClick={() => window.print()}>
              Print
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Student bills" value={inr0(studentTotal)} note={`${bills.length} students`} />
        <StatCard label="Staff recovery" value={inr0(staffTotal)} note={`${staffBills.length} staff`} tone="cyan" />
        <StatCard label="RT bills" value={inr0(rtTotal)} note={`${rtBills.length} tutors`} tone="lime" />
        <StatCard
          label="Daily mess rate"
          value={inr(data.settings.messDailyRate)}
          note="Per student per day"
          tone="amber"
        />
      </div>

      <Tabs defaultValue="students">
        <TabsList className="bg-white/5">
          <TabsTrigger value="students">Student bills</TabsTrigger>
          <TabsTrigger value="staff">Staff bills</TabsTrigger>
          <TabsTrigger value="rt">RT bills</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <Panel className="p-5">
            <div className="max-w-sm mb-4">
              <Field label="Search">
                <input
                  className={inputClass}
                  placeholder="Search student by name or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
            </div>
            <div className="overflow-x-auto print-area">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={thClass}>Student</th>
                    <th className={thClass}>Batch</th>
                    <th className={`${thClass} text-right`}>Days</th>
                    <th className={`${thClass} text-right`}>Rate</th>
                    <th className={`${thClass} text-right`}>Base mess</th>
                    <th className={`${thClass} text-right`}>Labour</th>
                    <th className={`${thClass} text-right`}>Estab.</th>
                    <th className={`${thClass} text-right`}>Elec.</th>
                    <th className={`${thClass} text-right`}>Extra</th>
                    <th className={`${thClass} text-right`}>Total</th>
                    <th className={`${thClass} text-right no-print`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((b) => (
                    <tr key={b.student.id} className="hover:bg-white/5">
                      <td className={tdClass}>
                        <span className="font-medium">{b.student.name}</span>
                        <span className="ml-2 text-[11px] text-ice/40 tnum">{b.student.id}</span>
                      </td>
                      <td className={`${tdClass} text-ice/60`}>{b.student.batch}</td>
                      <td className={`${tdClass} text-right tnum`}>{b.days}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.dailyRate)}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.baseMess)}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.labour)}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.establishment)}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.electricity)}</td>
                      <td className={`${tdClass} text-right tnum`}>{inr(b.extra)}</td>
                      <td className={`${tdClass} text-right tnum font-display font-semibold`}>
                        {inr(b.total)}
                      </td>
                      <td className={`${tdClass} text-right no-print`}>
                        <div className="flex justify-end gap-1.5">
                          <button className={btnSmall} onClick={() => setOpen(b)}>
                            View
                          </button>
                          <button
                            className={btnSmall}
                            onClick={() => studentBillPdf(b, month, data.settings)}
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20">
                    <td className="py-3 px-2 font-display font-bold" colSpan={9}>
                      TOTAL
                    </td>
                    <td className="py-3 px-2 text-right font-display font-bold tnum">
                      {inr(rows.reduce((a, b) => addMoney(a, b.total), 0))}
                    </td>
                    <td className="no-print" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <Panel className="p-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>Staff ID</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Department</th>
                  <th className={`${thClass} text-right`}>Days</th>
                  <th className={`${thClass} text-right`}>Food</th>
                  <th className={`${thClass} text-right`}>Other</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffBills.map((b) => (
                  <tr key={b.staff.id} className="hover:bg-white/5">
                    <td className={`${tdClass} text-ice/60 tnum`}>{b.staff.id}</td>
                    <td className={`${tdClass} font-medium`}>{b.staff.name}</td>
                    <td className={`${tdClass} text-ice/60`}>{b.staff.department}</td>
                    <td className={`${tdClass} text-right tnum`}>{b.staff.days}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.staff.food)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.staff.other)}</td>
                    <td className={`${tdClass} text-right tnum font-display font-semibold`}>
                      {inr(b.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </TabsContent>

        <TabsContent value="rt" className="mt-4">
          <Panel className="p-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>RT</th>
                  <th className={`${thClass} text-right`}>Days</th>
                  <th className={`${thClass} text-right`}>Daily rate</th>
                  <th className={`${thClass} text-right`}>Food</th>
                  <th className={`${thClass} text-right`}>Labour</th>
                  <th className={`${thClass} text-right`}>Electricity</th>
                  <th className={`${thClass} text-right`}>Extra</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rtBills.map((b) => (
                  <tr key={b.rt.id} className="hover:bg-white/5">
                    <td className={`${tdClass} font-medium`}>{b.rt.name}</td>
                    <td className={`${tdClass} text-right tnum`}>{b.days}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.dailyRate)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.food)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.labour)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.electricity)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.extra)}</td>
                    <td className={`${tdClass} text-right tnum font-display font-semibold`}>
                      {inr(b.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {open ? `Mess bill — ${open.student.name}` : "Mess bill"}
            </DialogTitle>
          </DialogHeader>
          {open ? (
            <div className="print-area">
              <p className="text-xs text-ice/50 mb-3">
                {open.student.id} · {open.student.batch} · {open.student.hostel} {open.student.room} ·{" "}
                {monthLabel(month)}
              </p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Mess days", String(open.days)],
                    ["Daily rate", inr(open.dailyRate)],
                    ["Base mess", inr(open.baseMess)],
                    ["Labour", inr(open.labour)],
                    ["Establishment", inr(open.establishment)],
                    ["Electricity", inr(open.electricity)],
                    ["Extra charges", inr(open.extra)],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="py-2 text-ice/70">{label}</td>
                      <td className="py-2 text-right tnum">{value}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20">
                    <td className="py-3 font-display font-bold">TOTAL</td>
                    <td className="py-3 text-right font-display font-bold tnum text-lg">
                      {inr(open.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="text-[11px] text-ice/40 mt-3">
                Demo Version — for demonstration purposes only.
              </p>
            </div>
          ) : null}
          <DialogFooter className="no-print">
            <button className={btnGhost} onClick={() => window.print()}>
              Print
            </button>
            <button
              className={btnPrimary}
              onClick={() => open && studentBillPdf(open, month, data.settings)}
            >
              Generate PDF
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
