import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";

import { useApp } from "@/lib/store";
import {
  Panel,
  PanelHeader,
  PageHeading,
  btnGhost,
  btnPrimary,
} from "@/components/mess/Panel";

export const Route = createFileRoute("/backup")({
  head: () => ({
    meta: [
      { title: "Backup & Restore — College Mess Management" },
      {
        name: "description",
        content:
          "Export the demo mess dataset as a local backup file and restore it again on the same machine.",
      },
      { property: "og:title", content: "Backup & Restore — College Mess Management" },
      {
        property: "og:description",
        content: "Local backup and restore for the mess demo dataset.",
      },
    ],
  }),
  component: BackupPage,
});

function BackupPage() {
  const { data, restoreData } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `college-mess-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Backup file downloaded.");
  };

  return (
    <>
      <PageHeading
        title="Backup & Restore"
        subtitle="Your data stays on this computer. Export a backup file any time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel className="p-6">
          <PanelHeader
            title="Export backup"
            subtitle={`${data.students.length} students · ${data.purchases.length} purchases · settings included`}
          />
          <button className={btnPrimary} onClick={download}>
            Download backup file
          </button>
        </Panel>

        <Panel className="p-6">
          <PanelHeader title="Restore backup" subtitle="Replaces all current demo data" />
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              restoreData(await file.text());
              e.target.value = "";
            }}
          />
          <button className={btnGhost} onClick={() => fileRef.current?.click()}>
            Choose backup file
          </button>
        </Panel>
      </div>
    </>
  );
}
