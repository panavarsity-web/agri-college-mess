import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useApp } from "@/lib/store";
import { daysInMonth, monthLabel } from "@/lib/types";
import { billableDays, calculateStudentBill } from "@/lib/calc";
import { inr } from "@/lib/money";
import { exportExcel } from "@/lib/exports";
import {
  Panel,
  PanelHeader,
  PageHeading,
  StatCard,
  Field,
  btnGhost,
  btnPrimary,
  btnSmall,
  inputClass,
  thClass,
  tdClass,
} from "@/components/mess/Panel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — College Mess Management" },
      {
        name: "description",
        content:
          "Mark mess attendance and leave, run bulk updates and see mess days flow straight into each student's bill.",
      },
      { property: "og:title", content: "Attendance — College Mess Management" },
      {
        property: "og:description",
        content: "Mark leave, apply bulk attendance and update billable mess days.",
      },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const { data, month, setMessDays, addLeave } = useApp();
  const total = daysInMonth(month);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<"Present" | "Absent" | "Leave">("Present");
  const [bulkDays, setBulkDays] = useState(1);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leave, setLeave] = useState({ studentId: "", from: "", to: "", reason: "", days: 1 });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.students
      .filter((s) => s.status === "Active")
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.id.includes(q))
      .map((s) => ({
        student: s,
        days: billableDays(data, month, s.id),
        bill: calculateStudentBill(data, month, s).total,
      }));
  }, [data, month, search]);

  const messStudents = rows.filter((r) => r.student.messStatus === "Mess");
  const totalDays = messStudents.reduce((a, r) => a + r.days, 0);
  const fullAttendance = messStudents.filter((r) => r.days === total).length;

  const allSelected = rows.length > 0 && selected.length === rows.length;

  const applyBulk = () => {
    if (selected.length === 0) {
      toast.error("Select at least one student first.");
      return;
    }
    selected.forEach((id) => {
      const current = billableDays(data, month, id);
      if (bulkStatus === "Present") setMessDays(id, total);
      else setMessDays(id, Math.max(0, current - bulkDays));
    });
    toast.success(
      `${bulkStatus} applied to ${selected.length} student(s). Bills recalculated automatically.`,
    );
    setSelected([]);
  };

  return (
    <>
      <PageHeading
        title="Attendance"
        subtitle={`${monthLabel(month)} · ${total} calendar days · mess days drive billing directly`}
        actions={
          <>
            <button
              className={btnGhost}
              onClick={() =>
                exportExcel(`Attendance-${month}`, [
                  {
                    name: "Attendance",
                    headers: ["Student ID", "Name", "Batch", "Mess Status", "Mess Days", "Absent", "Bill"],
                    rows: rows.map((r) => [
                      r.student.id,
                      r.student.name,
                      r.student.batch,
                      r.student.messStatus,
                      r.days,
                      total - r.days,
                      r.bill,
                    ]),
                  },
                ]).then(() => toast.success("Attendance exported to Excel."))
              }
            >
              Export Excel
            </button>
            <button
              className={btnPrimary}
              onClick={() => {
                setLeave({ studentId: rows[0]?.student.id ?? "", from: "", to: "", reason: "", days: 1 });
                setLeaveOpen(true);
              }}
            >
              Mark leave
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mess students" value={String(messStudents.length)} note="Active this month" />
        <StatCard label="Total mess days" value={String(totalDays)} note="Billable man days" tone="cyan" />
        <StatCard
          label="Full attendance"
          value={String(fullAttendance)}
          note={`${total} days present`}
          tone="lime"
        />
        <StatCard
          label="Leave records"
          value={String(data.leaves.filter((l) => l.month === month).length)}
          note="Recorded this month"
          tone="amber"
        />
      </div>

      <Panel className="p-5">
        <PanelHeader title="Bulk attendance" subtitle="Select students, choose a status and apply" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-56">
            <Field label="Search">
              <input
                className={inputClass}
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              className={inputClass}
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as typeof bulkStatus)}
            >
              <option value="Present">Present (full month)</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
            </select>
          </Field>
          {bulkStatus !== "Present" ? (
            <Field label="Days">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={bulkDays}
                onChange={(e) => setBulkDays(Math.max(1, Number(e.target.value)))}
              />
            </Field>
          ) : null}
          <button
            className={btnGhost}
            onClick={() => setSelected(allSelected ? [] : rows.map((r) => r.student.id))}
          >
            {allSelected ? "Clear selection" : "Select all"}
          </button>
          <button className={btnPrimary} onClick={applyBulk}>
            Apply status ({selected.length})
          </button>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className={`${thClass} w-10`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : rows.map((r) => r.student.id))}
                  />
                </th>
                <th className={thClass}>Student ID</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Batch</th>
                <th className={thClass}>Mess status</th>
                <th className={`${thClass} text-right`}>Mess days</th>
                <th className={`${thClass} text-right`}>Absent</th>
                <th className={`${thClass} text-right`}>Bill</th>
                <th className={`${thClass} text-right`}>Leave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(({ student, days, bill }) => (
                <tr key={student.id} className="hover:bg-white/5">
                  <td className={tdClass}>
                    <input
                      type="checkbox"
                      checked={selected.includes(student.id)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(student.id)
                            ? prev.filter((id) => id !== student.id)
                            : [...prev, student.id],
                        )
                      }
                    />
                  </td>
                  <td className={`${tdClass} tnum text-ice/60`}>{student.id}</td>
                  <td className={`${tdClass} font-medium`}>{student.name}</td>
                  <td className={tdClass}>{student.batch}</td>
                  <td className={`${tdClass} text-ice/60`}>{student.messStatus}</td>
                  <td className={`${tdClass} text-right`}>
                    <input
                      type="number"
                      min={0}
                      max={total}
                      className={`${inputClass} w-20 text-right tnum`}
                      value={days}
                      onChange={(e) =>
                        setMessDays(student.id, Math.max(0, Math.min(total, Number(e.target.value))))
                      }
                    />
                  </td>
                  <td className={`${tdClass} text-right tnum text-ice/60`}>{total - days}</td>
                  <td className={`${tdClass} text-right tnum font-display`}>{inr(bill)}</td>
                  <td className={`${tdClass} text-right`}>
                    <button
                      className={btnSmall}
                      onClick={() => {
                        setLeave({ studentId: student.id, from: "", to: "", reason: "", days: 1 });
                        setLeaveOpen(true);
                      }}
                    >
                      Mark leave
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Mark leave</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Student">
                <select
                  className={inputClass}
                  value={leave.studentId}
                  onChange={(e) => setLeave({ ...leave, studentId: e.target.value })}
                >
                  {rows.map((r) => (
                    <option key={r.student.id} value={r.student.id}>
                      {r.student.id} — {r.student.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="From">
              <input
                className={inputClass}
                placeholder="10-Sep-2026"
                value={leave.from}
                onChange={(e) => setLeave({ ...leave, from: e.target.value })}
              />
            </Field>
            <Field label="To">
              <input
                className={inputClass}
                placeholder="12-Sep-2026"
                value={leave.to}
                onChange={(e) => setLeave({ ...leave, to: e.target.value })}
              />
            </Field>
            <Field label="Days">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={leave.days}
                onChange={(e) => setLeave({ ...leave, days: Math.max(1, Number(e.target.value)) })}
              />
            </Field>
            <Field label="Reason">
              <input
                className={inputClass}
                value={leave.reason}
                onChange={(e) => setLeave({ ...leave, reason: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <button className={btnGhost} onClick={() => setLeaveOpen(false)}>
              Cancel
            </button>
            <button
              className={btnPrimary}
              onClick={() => {
                if (!leave.studentId) {
                  toast.error("Choose a student.");
                  return;
                }
                addLeave({ ...leave, month });
                setLeaveOpen(false);
              }}
            >
              Save leave
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
