import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useApp } from "@/lib/store";
import type { Settings } from "@/lib/types";
import {
  Panel,
  PanelHeader,
  PageHeading,
  Field,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/mess/Panel";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — College Mess Management" },
      {
        name: "description",
        content:
          "Configure mess daily rate, labour, establishment, electricity, gas and allocation rules used by every calculation.",
      },
      { property: "og:title", content: "Settings — College Mess Management" },
      {
        property: "og:description",
        content: "Mess rates, allocation rules, college information and demo data controls.",
      },
    ],
  }),
  component: SettingsPage,
});

const RATE_FIELDS: { key: keyof Settings; label: string }[] = [
  { key: "messDailyRate", label: "Mess daily rate (₹ / student / day)" },
  { key: "labour", label: "Labour charge (₹ / head)" },
  { key: "establishment", label: "Establishment charge (₹ / head)" },
  { key: "electricity", label: "Electricity charge (₹ / head)" },
  { key: "gasCylinderRate", label: "Gas cylinder rate (₹)" },
  { key: "gasDeliveryRate", label: "Gas delivery charge (₹)" },
  { key: "rtDailyRate", label: "RT daily rate (₹)" },
  { key: "dayScholarRate", label: "Day scholar rate (₹ / day)" },
];

function SettingsPage() {
  const { data, saveSettings, resetRates, resetDemoData } = useApp();
  const [form, setForm] = useState<Settings>(data.settings);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setForm(data.settings), [data.settings]);

  const num = (key: keyof Settings, value: string) =>
    setForm({ ...form, [key]: Math.max(0, Number(value)) } as Settings);

  return (
    <>
      <PageHeading
        title="Settings"
        subtitle="Every rate here feeds the single calculation engine used by dashboard, billing and reports."
        actions={
          <>
            <button className={btnGhost} onClick={resetRates}>
              Restore demo rates
            </button>
            <button className={btnPrimary} onClick={() => saveSettings(form)}>
              Save settings
            </button>
          </>
        }
      />

      <Panel className="p-6">
        <PanelHeader title="Mess rates" subtitle="Used for student, staff and RT billing" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {RATE_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form[f.key] as number}
                onChange={(e) => num(f.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <PanelHeader
          title="Allocation rules"
          subtitle="Share of egg and chicken cost allocated to grocery"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Egg grocery allocation (%)">
            <input
              type="number"
              className={inputClass}
              value={form.eggAllocationPct}
              onChange={(e) => num("eggAllocationPct", e.target.value)}
            />
          </Field>
          <Field label="Chicken grocery allocation (%)">
            <input
              type="number"
              className={inputClass}
              value={form.chickenAllocationPct}
              onChange={(e) => num("chickenAllocationPct", e.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <PanelHeader title="College information" subtitle="Printed on bills and reports" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Field label="College name">
            <input
              className={inputClass}
              value={form.collegeName}
              onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
            />
          </Field>
          <Field label="Hostel name">
            <input
              className={inputClass}
              value={form.hostelName}
              onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
            />
          </Field>
          <Field label="Office name">
            <input
              className={inputClass}
              value={form.officeName}
              onChange={(e) => setForm({ ...form, officeName: e.target.value })}
            />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <PanelHeader
          title="Demo data"
          subtitle="Restores the original demo dataset and keeps your configuration"
        />
        {confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-amber">
              This replaces all students, attendance, purchases and bills with the original demo
              dataset. Continue?
            </p>
            <button className={btnGhost} onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button
              className={btnPrimary}
              onClick={() => {
                resetDemoData();
                setConfirming(false);
              }}
            >
              Yes, reset demo data
            </button>
          </div>
        ) : (
          <button className={btnGhost} onClick={() => setConfirming(true)}>
            Reset demo data
          </button>
        )}
      </Panel>
    </>
  );
}
