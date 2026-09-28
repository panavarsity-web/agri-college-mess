import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { useApp } from "@/lib/store";
import { monthLabel } from "@/lib/types";
import { calculateRTBill, calculateStaffBill } from "@/lib/calc";
import { addMoney, inr, inr0 } from "@/lib/money";
import { exportExcel } from "@/lib/exports";
import {
  Panel,
  PageHeading,
  StatCard,
  btnGhost,
  inputClass,
  thClass,
  tdClass,
} from "@/components/mess/Panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff & Residential Tutors — College Mess Management" },
      {
        name: "description",
        content:
          "Mess staff recovery and residential tutor bills with editable days, food, labour and electricity charges.",
      },
      { property: "og:title", content: "Staff & Residential Tutors — College Mess Management" },
      {
        property: "og:description",
        content: "Manage mess staff recovery and residential tutor monthly bills.",
      },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const { data, month, updateStaff, updateRT } = useApp();

  const staffBills = data.staff.map(calculateStaffBill);
  const rtBills = data.rts.map((rt) => calculateRTBill(rt, data.settings));
  const staffTotal = staffBills.reduce((a, b) => addMoney(a, b.total), 0);
  const rtTotal = rtBills.reduce((a, b) => addMoney(a, b.total), 0);

  return (
    <>
      <PageHeading
        title="Staff & Residential Tutors"
        subtitle={`${monthLabel(month)} · staff recovery reduces the net mess expenditure`}
        actions={
          <button
            className={btnGhost}
            onClick={() =>
              exportExcel(`Staff-RT-${month}`, [
                {
                  name: "Staff",
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
                  name: "Residential Tutors",
                  headers: ["RT ID", "Name", "Days", "Food", "Labour", "Electricity", "Extra", "Total"],
                  rows: rtBills.map((b) => [
                    b.rt.id,
                    b.rt.name,
                    b.days,
                    b.food,
                    b.labour,
                    b.electricity,
                    b.extra,
                    b.total,
                  ]),
                },
              ]).then(() => toast.success("Staff and RT data exported."))
            }
          >
            Export Excel
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mess staff" value={String(data.staff.length)} note="On roll" />
        <StatCard label="Staff recovery" value={inr0(staffTotal)} note="Food + other" tone="cyan" />
        <StatCard label="Residential tutors" value={String(data.rts.length)} note="RT accounts" />
        <StatCard label="RT bills" value={inr0(rtTotal)} note={`${inr(data.settings.rtDailyRate)} per day`} tone="lime" />
      </div>

      <Tabs defaultValue="staff">
        <TabsList className="bg-white/5">
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="rt">Residential tutors</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-4">
          <Panel className="p-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>Staff ID</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Department</th>
                  <th className={`${thClass} text-right`}>Days</th>
                  <th className={`${thClass} text-right`}>Food (₹)</th>
                  <th className={`${thClass} text-right`}>Other (₹)</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffBills.map((b) => (
                  <tr key={b.staff.id} className="hover:bg-white/5">
                    <td className={`${tdClass} text-ice/60 tnum`}>{b.staff.id}</td>
                    <td className={`${tdClass} font-medium`}>{b.staff.name}</td>
                    <td className={`${tdClass} text-ice/60`}>{b.staff.department}</td>
                    <td className={`${tdClass} text-right`}>
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-20 text-right tnum`}
                        value={b.staff.days}
                        onChange={(e) =>
                          updateStaff(b.staff.id, { days: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-28 text-right tnum`}
                        value={b.staff.food}
                        onChange={(e) =>
                          updateStaff(b.staff.id, { food: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-28 text-right tnum`}
                        value={b.staff.other}
                        onChange={(e) =>
                          updateStaff(b.staff.id, { other: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </td>
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
            <table className="w-full text-sm min-w-[880px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thClass}>Residential tutor</th>
                  <th className={`${thClass} text-right`}>Days</th>
                  <th className={`${thClass} text-right`}>Daily rate</th>
                  <th className={`${thClass} text-right`}>Food</th>
                  <th className={`${thClass} text-right`}>Labour</th>
                  <th className={`${thClass} text-right`}>Electricity</th>
                  <th className={`${thClass} text-right`}>Extra (₹)</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rtBills.map((b) => (
                  <tr key={b.rt.id} className="hover:bg-white/5">
                    <td className={`${tdClass} font-medium`}>{b.rt.name}</td>
                    <td className={`${tdClass} text-right`}>
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-20 text-right tnum`}
                        value={b.rt.days}
                        onChange={(e) =>
                          updateRT(b.rt.id, { days: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.dailyRate)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.food)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.labour)}</td>
                    <td className={`${tdClass} text-right tnum`}>{inr(b.electricity)}</td>
                    <td className={`${tdClass} text-right`}>
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} w-28 text-right tnum`}
                        value={b.rt.extra}
                        onChange={(e) =>
                          updateRT(b.rt.id, { extra: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </td>
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
    </>
  );
}
