import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useApp } from "@/lib/store";
import { MONTHS, daysInMonth, monthLabel } from "@/lib/types";
import { EXTRA_CATEGORIES, type ExtraCategory } from "@/lib/types";
import { billableDays, calculateStudentBill, studentExtras } from "@/lib/calc";
import { inr } from "@/lib/money";
import { studentBillPdf } from "@/lib/exports";
import {
  Panel,
  PageHeading,
  Pill,
  Field,
  btnGhost,
  btnPrimary,
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

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Profile — College Mess Management" },
      {
        name: "description",
        content:
          "Student mess profile: attendance, mess days, bill break-up, extra charges and previous month history.",
      },
      { property: "og:title", content: "Student Profile — College Mess Management" },
      {
        property: "og:description",
        content: "Attendance, bill break-up and extra charges for a hostel mess student.",
      },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { studentId } = Route.useParams();
  const { data, month, addExtra } = useApp();
  const [open, setOpen] = useState(false);
  const [extra, setExtra] = useState({
    date: "20-Sep-2026",
    category: "Special Meal" as ExtraCategory,
    amount: 100,
    reason: "",
  });

  const student = data.students.find((s) => s.id === studentId);
  const bill = useMemo(
    () => (student ? calculateStudentBill(data, month, student) : null),
    [data, month, student],
  );

  if (!student || !bill) {
    return (
      <Panel className="p-8">
        <p className="text-sm text-ice/60">
          No student found with ID {studentId}.{" "}
          <Link to="/students" className="text-cyan underline">
            Back to students
          </Link>
        </p>
      </Panel>
    );
  }

  const total = daysInMonth(month);
  const extras = studentExtras(data, month, student.id);

  return (
    <>
      <PageHeading
        title={student.name}
        subtitle={`${student.id} · ${student.batch} · ${student.gender} · ${student.hostel} ${student.room}`}
        actions={
          <>
            <Pill tone={student.status === "Active" ? "lime" : "rose"}>{student.status}</Pill>
            <button className={btnGhost} onClick={() => setOpen(true)}>
              + Extra charge
            </button>
            <button
              className={btnPrimary}
              onClick={() => studentBillPdf(bill, month, data.settings)}
            >
              Generate PDF
            </button>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="bill">Bill</TabsTrigger>
          <TabsTrigger value="extras">Extra charges</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Panel className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Detail label="Current month" value={monthLabel(month)} />
            <Detail label="Mess days" value={String(bill.days)} />
            <Detail label="Daily rate" value={inr(bill.dailyRate)} />
            <Detail label="Current bill" value={inr(bill.total)} />
            <Detail label="Department" value={student.department} />
            <Detail label="Mess status" value={student.messStatus} />
            <Detail label="Admission date" value={student.admissionDate} />
            <Detail label="Room" value={`${student.hostel} · ${student.room}`} />
          </Panel>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Panel className="p-6 grid grid-cols-3 gap-6">
            <Detail label="Days present" value={String(bill.days)} />
            <Detail label="Days absent" value={String(Math.max(0, total - bill.days))} />
            <Detail label="Mess reduction" value={`${Math.max(0, total - bill.days)} day(s)`} />
          </Panel>
        </TabsContent>

        <TabsContent value="bill" className="mt-4">
          <Panel className="p-6 print-area">
            <table className="w-full text-sm max-w-xl">
              <tbody className="divide-y divide-white/5">
                <BillRow label="Mess days" value={String(bill.days)} />
                <BillRow label="Daily rate" value={inr(bill.dailyRate)} />
                <BillRow label="Base mess" value={inr(bill.baseMess)} />
                <BillRow label="Labour" value={inr(bill.labour)} />
                <BillRow label="Establishment" value={inr(bill.establishment)} />
                <BillRow label="Electricity" value={inr(bill.electricity)} />
                <BillRow label="Extra" value={inr(bill.extra)} />
              </tbody>
              <tfoot>
                <tr className="border-t border-white/20">
                  <td className="py-3 font-display font-bold">TOTAL</td>
                  <td className="py-3 text-right font-display font-bold tnum text-lg">
                    {inr(bill.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <div className="flex gap-2 mt-5 no-print">
              <button className={btnGhost} onClick={() => window.print()}>
                Print
              </button>
              <button
                className={btnPrimary}
                onClick={() => studentBillPdf(bill, month, data.settings)}
              >
                Generate PDF
              </button>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="extras" className="mt-4">
          <Panel className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Reason</th>
                  <th className={`${thClass} text-right`}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {extras.map((e) => (
                  <tr key={e.id}>
                    <td className={tdClass}>{e.date}</td>
                    <td className={tdClass}>{e.category}</td>
                    <td className={`${tdClass} text-ice/60`}>{e.reason}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {extras.length === 0 ? (
              <p className="text-sm text-ice/50 py-6">No extra charges this month.</p>
            ) : null}
          </Panel>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Panel className="p-6">
            <table className="w-full text-sm max-w-2xl">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>Month</th>
                  <th className={`${thClass} text-right`}>Mess days</th>
                  <th className={`${thClass} text-right`}>Total bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MONTHS.map((m) => (
                  <tr key={m.key}>
                    <td className={tdClass}>{m.label}</td>
                    <td className={`${tdClass} text-right tnum`}>
                      {billableDays(data, m.key, student.id)}
                    </td>
                    <td className={`${tdClass} text-right tnum`}>
                      {inr(calculateStudentBill(data, m.key, student).total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add extra charge</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <input
                className={inputClass}
                value={extra.date}
                onChange={(e) => setExtra({ ...extra, date: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={extra.category}
                onChange={(e) => setExtra({ ...extra, category: e.target.value as ExtraCategory })}
              >
                {EXTRA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (₹)">
              <input
                type="number"
                className={inputClass}
                value={extra.amount}
                onChange={(e) => setExtra({ ...extra, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Reason">
              <input
                className={inputClass}
                value={extra.reason}
                onChange={(e) => setExtra({ ...extra, reason: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <button className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className={btnPrimary}
              onClick={() => {
                addExtra({ ...extra, month, studentId: student.id });
                setOpen(false);
              }}
            >
              Add charge
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-ice/45">{label}</p>
      <p className="font-display text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function BillRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2.5 text-ice/70">{label}</td>
      <td className="py-2.5 text-right tnum">{value}</td>
    </tr>
  );
}
