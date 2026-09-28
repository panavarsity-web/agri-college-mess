import { createFileRoute } from "@tanstack/react-router";

import { useApp } from "@/lib/store";
import { Panel, PanelHeader, PageHeading, Pill } from "@/components/mess/Panel";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About this Demo — College Mess Management" },
      {
        name: "description",
        content:
          "About the College Mess Management demo: purpose, included modules and what this demo version does not cover.",
      },
      { property: "og:title", content: "About this Demo — College Mess Management" },
      {
        property: "og:description",
        content: "Demo Version 1.0 of the college mess billing and management system.",
      },
    ],
  }),
  component: AboutPage,
});

const MODULES = [
  "Dashboard with live mess statistics",
  "Student register and mess profiles",
  "Attendance, leave and bulk updates",
  "Purchase register with category allocation",
  "Student, staff and RT billing",
  "Monthly summary and reports",
  "PDF, Excel and print output",
  "Rates, allocation rules and settings",
];

function AboutPage() {
  const { data } = useApp();

  return (
    <>
      <PageHeading
        title="About this demo"
        subtitle="College Mess Management — Demo Version 1.0"
        actions={<Pill tone="lime">Demo Mode</Pill>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel className="p-6">
          <PanelHeader title="Purpose" subtitle={data.settings.collegeName} />
          <p className="text-sm text-ice/70 leading-relaxed">
            This demo shows how a college mess office can enter data once and get automatic mess
            billing, expenditure tracking and a monthly summary. Students, attendance, purchases and
            rates all feed a single calculation engine, so any change flows straight into the
            dashboard, bills and reports.
          </p>
          <p className="text-sm text-ice/50 mt-4">
            This is not production software. Demo data is for demonstration purposes only and does
            not represent real people or real transactions.
          </p>
        </Panel>

        <Panel className="p-6">
          <PanelHeader title="Modules included" subtitle="Everything in Version 1.0" />
          <ul className="space-y-2 text-sm text-ice/75">
            {MODULES.map((m) => (
              <li key={m} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1.5 rounded-full bg-lime shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
