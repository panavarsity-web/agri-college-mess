import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useApp } from "@/lib/store";
import {
  PURCHASE_CATEGORIES,
  monthLabel,
  type Purchase,
  type PurchaseCategory,
} from "@/lib/types";
import {
  CATEGORY_ACCENT,
  calculateChickenCost,
  calculateEggCost,
  calculateGasCost,
  categoryTotals,
  monthPurchases,
  purchaseAmount,
} from "@/lib/calc";
import { addMoney, inr, inr0, mulMoney } from "@/lib/money";
import { exportExcel } from "@/lib/exports";
import {
  Panel,
  PanelHeader,
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

export const Route = createFileRoute("/purchases")({
  validateSearch: (search: Record<string, unknown>): { category?: string; q?: string } => {
    const out: { category?: string; q?: string } = {};
    if (typeof search["category"] === "string") out.category = search["category"];
    if (typeof search["q"] === "string") out.q = search["q"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Purchases — College Mess Management" },
      {
        name: "description",
        content:
          "Purchase register by category with automatic gross, GST, delivery and total calculation for mess provisions.",
      },
      { property: "og:title", content: "Purchases — College Mess Management" },
      {
        property: "og:description",
        content: "Record supplier invoices and see category-wise mess expenditure update instantly.",
      },
    ],
  }),
  component: PurchasesPage,
});

const emptyPurchase = (month: Purchase["month"]): Omit<Purchase, "id"> => ({
  month,
  date: "",
  invoiceNo: "",
  supplier: "",
  category: "Grocery",
  item: "",
  quantity: 0,
  unit: "Kg",
  rate: 0,
  gst: 0,
  delivery: 0,
  remarks: "",
  status: "Paid",
});

function PurchasesPage() {
  const { data, month, addPurchase, deletePurchase } = useApp();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Purchase, "id">>(emptyPurchase(month));
  const [error, setError] = useState("");
  const [text, setText] = useState(search.q ?? "");

  const category = search.category ?? "All";
  const purchases = useMemo(() => monthPurchases(data, month), [data, month]);
  const totals = useMemo(() => categoryTotals(purchases), [purchases]);
  const gas = useMemo(() => calculateGasCost(purchases, data.settings), [purchases, data.settings]);
  const egg = useMemo(() => calculateEggCost(purchases, data.settings), [purchases, data.settings]);
  const chicken = useMemo(
    () => calculateChickenCost(purchases, data.settings),
    [purchases, data.settings],
  );

  const rows = useMemo(() => {
    const q = text.trim().toLowerCase();
    return purchases.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q ||
          p.item.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q) ||
          p.invoiceNo.toLowerCase().includes(q)),
    );
  }, [purchases, category, text]);

  const shown = rows.reduce((a, p) => addMoney(a, purchaseAmount(p)), 0);
  const formTotal = addMoney(mulMoney(form.quantity, form.rate), form.gst, form.delivery);

  const submit = () => {
    if (!form.date.trim() || !form.category) {
      setError("Purchase date and category are required.");
      return;
    }
    if (form.quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if (form.rate < 0) {
      setError("Rate cannot be negative.");
      return;
    }
    const result = addPurchase({ ...form, month });
    if (!result.ok) {
      setError(result.error ?? "Could not save the purchase.");
      return;
    }
    setOpen(false);
    setError("");
  };

  return (
    <>
      <PageHeading
        title="Purchases"
        subtitle={`${monthLabel(month)} · ${rows.length} vouchers · ${inr0(shown)} shown`}
        actions={
          <>
            <button
              className={btnPrimary}
              onClick={() => {
                setForm(emptyPurchase(month));
                setError("");
                setOpen(true);
              }}
            >
              + Add purchase
            </button>
            <button
              className={btnGhost}
              onClick={() =>
                exportExcel(`Purchase-Register-${month}`, [
                  {
                    name: "Purchases",
                    headers: [
                      "Date",
                      "Invoice No",
                      "Supplier",
                      "Category",
                      "Item",
                      "Quantity",
                      "Unit",
                      "Rate",
                      "GST",
                      "Delivery",
                      "Total",
                      "Status",
                    ],
                    rows: rows.map((p) => [
                      p.date,
                      p.invoiceNo,
                      p.supplier,
                      p.category,
                      p.item,
                      p.quantity,
                      p.unit,
                      p.rate,
                      p.gst,
                      p.delivery,
                      purchaseAmount(p),
                      p.status,
                    ]),
                  },
                ]).then(() => toast.success("Purchase register exported."))
              }
            >
              Export Excel
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {PURCHASE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() =>
              navigate({ search: category === c ? {} : { category: c } })
            }
            className={`glass rounded-2xl p-4 text-left transition hover:border-white/25 ${
              category === c ? "border-brand/60" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${CATEGORY_ACCENT[c] ?? "bg-brand"}`} />
              <span className="text-[11px] uppercase tracking-[0.12em] text-ice/50">{c}</span>
            </div>
            <p className="font-display text-lg font-semibold mt-1.5 tnum">
              {inr0(totals[c] ?? 0)}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="p-5">
          <PanelHeader title="Gas" subtitle={`${gas.cylinders} cylinders`} />
          <p className="text-sm text-ice/70">
            Cylinder cost {inr(gas.gasCost)} + delivery {inr(gas.delivery)}
          </p>
          <p className="font-display text-xl font-semibold mt-2 tnum">{inr(gas.total)}</p>
        </Panel>
        <Panel className="p-5">
          <PanelHeader title="Egg" subtitle={`${egg.count} eggs`} />
          <p className="text-sm text-ice/70">
            Purchase {inr(egg.purchaseCost)} + {data.settings.eggAllocationPct}% grocery allocation{" "}
            {inr(egg.groceryAllocation)}
          </p>
          <p className="font-display text-xl font-semibold mt-2 tnum">{inr(egg.total)}</p>
        </Panel>
        <Panel className="p-5">
          <PanelHeader title="Chicken" subtitle={`${chicken.quantity} kg`} />
          <p className="text-sm text-ice/70">
            Purchase {inr(chicken.purchaseCost)} + {data.settings.chickenAllocationPct}% grocery
            allocation {inr(chicken.groceryAllocation)}
          </p>
          <p className="font-display text-xl font-semibold mt-2 tnum">{inr(chicken.total)}</p>
        </Panel>
      </div>

      <Panel className="p-5">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-56">
            <Field label="Search">
              <input
                className={inputClass}
                placeholder="Search item, supplier or invoice…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Category">
            <select
              className={inputClass}
              value={category}
              onChange={(e) =>
                navigate({
                  search: e.target.value === "All" ? {} : { category: e.target.value },
                })
              }
            >
              <option value="All">All categories</option>
              {PURCHASE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className={thClass}>Date</th>
                <th className={thClass}>Invoice</th>
                <th className={thClass}>Supplier</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Item</th>
                <th className={`${thClass} text-right`}>Qty</th>
                <th className={`${thClass} text-right`}>Rate</th>
                <th className={`${thClass} text-right`}>GST</th>
                <th className={`${thClass} text-right`}>Delivery</th>
                <th className={`${thClass} text-right`}>Total</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className={`${tdClass} text-ice/60`}>{p.date}</td>
                  <td className={`${tdClass} tnum text-ice/60`}>{p.invoiceNo}</td>
                  <td className={tdClass}>{p.supplier}</td>
                  <td className={tdClass}>{p.category}</td>
                  <td className={`${tdClass} font-medium`}>{p.item}</td>
                  <td className={`${tdClass} text-right tnum`}>
                    {p.quantity} {p.unit}
                  </td>
                  <td className={`${tdClass} text-right tnum`}>{inr(p.rate)}</td>
                  <td className={`${tdClass} text-right tnum`}>{inr(p.gst)}</td>
                  <td className={`${tdClass} text-right tnum`}>{inr(p.delivery)}</td>
                  <td className={`${tdClass} text-right tnum font-display font-semibold`}>
                    {inr(purchaseAmount(p))}
                  </td>
                  <td className={tdClass}>
                    <Pill tone={p.status === "Paid" ? "lime" : "amber"}>{p.status}</Pill>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <button className={btnSmall} onClick={() => deletePurchase(p.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="text-sm text-ice/50 py-8 text-center">No purchases match these filters.</p>
          ) : null}
        </div>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Add purchase</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Date">
              <input
                className={inputClass}
                placeholder="20-Sep-2026"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Invoice no">
              <input
                className={inputClass}
                value={form.invoiceNo}
                onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              />
            </Field>
            <Field label="Supplier">
              <select
                className={inputClass}
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              >
                <option value="">Select supplier</option>
                {data.suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as PurchaseCategory })
                }
              >
                {PURCHASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Item">
              <input
                className={inputClass}
                value={form.item}
                onChange={(e) => setForm({ ...form, item: e.target.value })}
              />
            </Field>
            <Field label="Unit">
              <input
                className={inputClass}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                className={inputClass}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </Field>
            <Field label="Rate (₹)">
              <input
                type="number"
                className={inputClass}
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
              />
            </Field>
            <Field label="GST (₹)">
              <input
                type="number"
                className={inputClass}
                value={form.gst}
                onChange={(e) => setForm({ ...form, gst: Number(e.target.value) })}
              />
            </Field>
            <Field label="Delivery (₹)">
              <input
                type="number"
                className={inputClass}
                value={form.delivery}
                onChange={(e) => setForm({ ...form, delivery: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Purchase["status"] })
                }
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </Field>
            <Field label="Remarks">
              <input
                className={inputClass}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </Field>
          </div>
          <div className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-ice/60">
              Gross {inr(mulMoney(form.quantity, form.rate))} + GST {inr(form.gst)} + delivery{" "}
              {inr(form.delivery)}
            </span>
            <span className="font-display text-lg font-semibold tnum">{inr(formTotal)}</span>
          </div>
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <DialogFooter>
            <button className={btnGhost} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className={btnPrimary} onClick={submit}>
              Save purchase
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
