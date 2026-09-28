import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass rounded-2xl relative overflow-hidden", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {subtitle ? <p className="text-[11px] text-ice/50 mt-0.5">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold leading-none">{title}</h1>
        {subtitle ? <p className="text-[12px] text-ice/50 mt-1.5">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div> : null}
    </div>
  );
}

export const btnPrimary =
  "rounded-xl px-4 py-2.5 font-display font-semibold text-sm bg-gradient-to-r from-brand to-cyan text-white shadow-lg shadow-brand/30 hover:brightness-110 transition disabled:opacity-50";

export const btnGhost =
  "rounded-xl px-4 py-2.5 font-display font-semibold text-sm bg-white/10 hover:bg-white/15 border border-white/10 transition disabled:opacity-50";

export const btnSmall =
  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-white/10 hover:bg-white/15 border border-white/10 transition";

export const inputClass =
  "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-ice placeholder:text-ice/35 focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/25";

export function StatCard({
  label,
  value,
  note,
  tone = "muted",
  onClick,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "muted" | "lime" | "amber" | "rose" | "cyan";
  onClick?: () => void;
}) {
  const noteTone = {
    muted: "text-ice/50",
    lime: "text-lime",
    amber: "text-amber",
    rose: "text-rose",
    cyan: "text-cyan",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "glass rounded-2xl p-5 text-left relative overflow-hidden",
        onClick && "hover:brightness-110 transition",
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-ice/50">{label}</p>
      <p className="font-display text-3xl font-bold mt-2 tnum">{value}</p>
      {note ? <p className={cn("text-[11px] mt-1", noteTone)}>{note}</p> : null}
    </button>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "lime" | "amber" | "rose" | "cyan";
}) {
  const tones = {
    neutral: "bg-white/10 text-ice/70",
    lime: "bg-lime/15 text-lime",
    amber: "bg-amber/15 text-amber",
    rose: "bg-rose/15 text-rose",
    cyan: "bg-cyan/15 text-cyan",
  };
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap", tones[tone])}>
      {children}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ice/50">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const thClass =
  "text-left py-2 px-2 font-medium text-[11px] uppercase tracking-wider text-ice/40 whitespace-nowrap";
export const tdClass = "py-2.5 px-2 whitespace-nowrap";
