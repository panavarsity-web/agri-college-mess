/**
 * Decimal-safe currency helpers.
 * All money is kept as a number of rupees but every boundary value is rounded
 * through round2 (half-up on integer paise) so totals never drift.
 */

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function addMoney(...values: number[]): number {
  const paise = values.reduce((acc, v) => acc + Math.round(v * 100), 0);
  return paise / 100;
}

/** Quantity × rate, rounded to paise. */
export function mulMoney(quantity: number, rate: number): number {
  return round2(quantity * rate);
}

export function pct(value: number, percent: number): number {
  return round2((value * percent) / 100);
}

export function inr(value: number, decimals = 2): string {
  return `₹${(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function inr0(value: number): string {
  return inr(Math.round(value ?? 0), 0);
}

/** Compact Indian display: ₹4.01L / ₹40,736 */
export function inrCompact(value: number): string {
  const v = value ?? 0;
  if (Math.abs(v) >= 10000000) return `₹${round2(v / 10000000)}Cr`;
  if (Math.abs(v) >= 100000) return `₹${round2(v / 100000)}L`;
  return inr0(v);
}
