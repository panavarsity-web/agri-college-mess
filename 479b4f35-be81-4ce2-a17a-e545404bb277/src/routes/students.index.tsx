import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useApp } from "@/lib/store";
import { monthLabel, type Gender, type MessStatus, type RecordStatus, type Student } from "@/lib/types";
import { billableDays, calculateStudentBill } from "@/lib/calc";
import { inr } from "@/lib/money";
import { exportExcel } from "@/lib/exports";
import {
  Panel,
  PageHeading,
  Pill,
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

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Students — College Mess Management" },
      {
        name: "description",
        content:
          "Student register with batch, gender and mess status filters, mess days and current month bill for each student.",
      },
      { property: "og:title", content: "Students — College Mess Management" },
      {
        property: "og:description",
        content: "Search, add and manage hostel students and their mess accounts.",
      },
    ],
  }),
  component: StudentsPage,
});

const emptyStudent = (): Student => ({
  id: "",
  name: "",
  batch: "2026",
  gender: "Male",
  department: "B.Sc Computer Science",
  hostel: "Men's Hostel",
  room: "",
  messStatus: "Mess",
  admissionDate: "01-Jun-2026",
  status: "Active",
});

function StudentsPage() {
  const { data, month, addStudent, updateStudent } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("All");
  const [gender, setGender] = useState("All");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Student>(emptyStudent());
  const [error, setError] = useState("");

  const batches = useMemo(
    () => [...new Set(data.students.map((s) => s.batch))].sort(),
    [data.students],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.students
      .filter(
        (s) =>
          (!q || s.name.toLowerCase().includes(q) || s.id.includes(q)) &&
          (batch === "All" || s.batch === batch) &&
          (gender === "All" || s.gender === gender) &&
          (status === "All" || s.status === status),
      )
      .map((s) => ({
        student: s,
        days: billableDays(data, month, s.id),
        bill: calculateStudentBill(data, month, s).total,
      }));
  }, [data, month, search, batch, gender, status]);

  const submit = () => {
    if (!form.id.trim() || !form.name.trim() || !form.batch.trim() || !form.gender) {
      setError("Student ID, name, batch and gender are required.");
      return;
    }
    if (editing) {
      updateStudent(editing.id, form);
    } else {
      const result = addStudent({ ...form, id: form.id.trim(), name: form.name.trim().toUpperCase() });
      if (!result.ok) {
        setError(result.error ?? "Could not save the student.");
        return;
      }
    }
    setOpen(false);
    setError("");
  };

  return (
    <>
      <PageHeading
        title="Students"
        subtitle={`${rows.length} of ${data.students.length} students · ${monthLabel(month)}`}
        actions={
          <>
            <button
              className={btnPrimary}
              onClick={() => {
                setEditing(null);
                setForm(emptyStudent());
                setError("");
                setOpen(true);
              }}
            >
              + Add student
            </button>
            <button
              className={btnGhost}
              onClick={() =>
                exportExcel(`Students-${month}`, [
                  {
                    name: "Students",
                    headers: [
                      "Student ID",
                      "Name",
                      "Batch",
                      "Gender",
                      "Department",
                      "Hostel",
                      "Room",
                      "Mess Status",
                      "Days",
                      "Current Bill",
                      "Status",
                    ],
                    rows: rows.map((r) => [
                      r.student.id,
                      r.student.name,
                      r.student.batch,
                      r.student.gender,
                      r.student.department,
                      r.student.hostel,
                      r.student.room,
                      r.student.messStatus,
                      r.days,
                      r.bill,
                      r.student.status,
                    ]),
                  },
                ]).then(() => toast.success("Excel export generated."))
              }
            >
              Export Excel
            </button>
          </>
        }
      />

      <Panel className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-56">
            <Field label="Search">
              <input
                className={inputClass}
                placeholder="Search students by name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Batch">
            <select className={inputClass} value={batch} onChange={(e) => setBatch(e.target.value)}>
              <option value="All">All</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gender">
            <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className={thClass}>Student ID</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Batch</th>
                <th className={thClass}>Gender</th>
                <th className={thClass}>Hostel</th>
                <th className={thClass}>Room</th>
                <th className={thClass}>Mess status</th>
                <th className={`${thClass} text-right`}>Days</th>
                <th className={`${thClass} text-right`}>Current bill</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(({ student, days, bill }) => (
                <tr key={student.id} className="hover:bg-white/5">
                  <td className={`${tdClass} tnum text-ice/60`}>{student.id}</td>
                  <td className={`${tdClass} font-medium`}>{student.name}</td>
                  <td className={tdClass}>{student.batch}</td>
                  <td className={`${tdClass} text-ice/60`}>{student.gender}</td>
                  <td className={`${tdClass} text-ice/60`}>{student.hostel}</td>
                  <td className={`${tdClass} text-ice/60`}>{student.room}</td>
                  <td className={tdClass}>
                    <Pill tone={student.messStatus === "Mess" ? "lime" : "cyan"}>
                      {student.messStatus}
                    </Pill>
                  </td>
                  <td className={`${tdClass} text-right tnum`}>{days}</td>
                  <td className={`${tdClass} text-right tnum font-display`}>{inr(bill)}</td>
                  <td className={tdClass}>
                    <Pill tone={student.status === "Active" ? "lime" : "rose"}>{student.status}</Pill>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      <button
                        className={btnSmall}
                        onClick={() =>
                          navigate({ to: "/students/$studentId", params: { studentId: student.id } })
                        }
                      >
                        View
                      </button>
                      <button
                        className={btnSmall}
                        onClick={() => {
                          setEditing(student);
                          setForm(student);
                          setError("");
                          setOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={btnSmall}
                        onClick={() =>
                          updateStudent(student.id, {
                            status: student.status === "Active" ? "Inactive" : "Active",
                          })
                        }
                      >
                        {student.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="text-sm text-ice/50 py-8 text-center">No students match these filters.</p>
          ) : null}
        </div>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit student" : "Add student"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Student ID">
              <input
                className={inputClass}
                value={form.id}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="202601051"
              />
            </Field>
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ARUN KUMAR"
              />
            </Field>
            <Field label="Batch">
              <input
                className={inputClass}
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
              />
            </Field>
            <Field label="Gender">
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="Department">
              <input
                className={inputClass}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </Field>
            <Field label="Hostel">
              <input
                className={inputClass}
                value={form.hostel}
                onChange={(e) => setForm({ ...form, hostel: e.target.value })}
              />
            </Field>
            <Field label="Room">
              <input
                className={inputClass}
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
              />
            </Field>
            <Field label="Mess status">
              <select
                className={inputClass}
                value={form.messStatus}
                onChange={(e) => setForm({ ...form, messStatus: e.target.value as MessStatus })}
              >
                <option value="Mess">Mess</option>
                <option value="Day Scholar">Day Scholar</option>
              </select>
            </Field>
            <Field label="Admission date">
              <input
                className={inputClass}
                value={form.admissionDate}
                onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as RecordStatus })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <DialogFooter>
            <button className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className={btnPrimary} onClick={submit}>
              {editing ? "Save changes" : "Save student"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
