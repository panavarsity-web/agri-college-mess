/** Excel + PDF generation. Everything is loaded lazily so it stays client-side. */
import { inr, round2 } from "./money";
import { monthLabel, type MonthKey, type Settings } from "./types";
import type { MonthlySummary, StudentBill } from "./calc";

export type Row = (string | number)[];

export async function exportExcel(
  fileName: string,
  sheets: { name: string; headers: string[]; rows: Row[] }[],
) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    ws["!cols"] = sheet.headers.map((h) => ({ wch: Math.max(12, h.length + 4) }));
    XLSX.utils.book_append_sheet(book, ws, sheet.name.slice(0, 30));
  }
  XLSX.writeFile(book, `${fileName}.xlsx`);
}

async function newDoc(orientation: "portrait" | "landscape", title: string, month: MonthKey, settings: Settings) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("COLLEGE MESS MANAGEMENT", width / 2, 40, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${settings.collegeName} · ${settings.hostelName}`, width / 2, 56, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${title} — ${monthLabel(month)}`, width / 2, 76, { align: "center" });

  return { doc, autoTable, width };
}

function footer(doc: import("jspdf").jsPDF) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Demo Version — for demonstration purposes only", width / 2, height - 24, {
    align: "center",
  });
}

export async function studentBillPdf(bill: StudentBill, month: MonthKey, settings: Settings) {
  const { doc, autoTable } = await newDoc("portrait", "Student Mess Bill", month, settings);

  autoTable(doc, {
    startY: 100,
    theme: "plain",
    body: [
      ["Student Name", bill.student.name],
      ["Student ID", bill.student.id],
      ["Batch / Gender", `${bill.student.batch} · ${bill.student.gender}`],
      ["Hostel / Room", `${bill.student.hostel} · ${bill.student.room}`],
    ],
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 140 } },
  });

  autoTable(doc, {
    head: [["Particulars", "Amount (INR)"]],
    body: [
      ["Mess Days", String(bill.days)],
      ["Daily Rate", inr(bill.dailyRate)],
      ["Base Mess", inr(bill.baseMess)],
      ["Labour", inr(bill.labour)],
      ["Establishment", inr(bill.establishment)],
      ["Electricity", inr(bill.electricity)],
      ["Extra Charges", inr(bill.extra)],
    ],
    foot: [["TOTAL", inr(bill.total)]],
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [62, 99, 255] },
    footStyles: { fillColor: [7, 11, 22], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
  });

  footer(doc);
  doc.save(`Mess-Bill-${bill.student.id}-${month}.pdf`);
}

export async function billRegisterPdf(bills: StudentBill[], month: MonthKey, settings: Settings) {
  const { doc, autoTable } = await newDoc("landscape", "Student Bill Register", month, settings);
  autoTable(doc, {
    startY: 95,
    head: [
      [
        "S.No",
        "Student ID",
        "Name",
        "Batch",
        "Gender",
        "Days",
        "Daily Rate",
        "Base Mess",
        "Labour",
        "Estab.",
        "Elec.",
        "Extra",
        "Total",
      ],
    ],
    body: bills.map((b, i) => [
      i + 1,
      b.student.id,
      b.student.name,
      b.student.batch,
      b.student.gender,
      b.days,
      inr(b.dailyRate),
      inr(b.baseMess),
      inr(b.labour),
      inr(b.establishment),
      inr(b.electricity),
      inr(b.extra),
      inr(b.total),
    ]),
    foot: [
      [
        "",
        "",
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        inr(round2(bills.reduce((a, b) => a + b.total, 0))),
      ],
    ],
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: [62, 99, 255] },
    footStyles: { fillColor: [7, 11, 22], textColor: 255, fontStyle: "bold" },
  });
  footer(doc);
  doc.save(`Student-Bill-Register-${month}.pdf`);
}

export async function monthlySummaryPdf(
  summary: MonthlySummary,
  month: MonthKey,
  settings: Settings,
) {
  const { doc, autoTable } = await newDoc("portrait", "Monthly Summary", month, settings);

  autoTable(doc, {
    startY: 100,
    head: [["Heads", "Count"]],
    body: [
      ["Students", String(summary.students)],
      ["Staff", String(summary.staff)],
      ["Residential Tutors", String(summary.rts)],
      ["Total Man Days", String(summary.manDays)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [62, 99, 255] },
  });

  autoTable(doc, {
    head: [["Expenditure", "Amount (INR)"]],
    body: Object.entries(summary.byCategory).map(([k, v]) => [k, inr(v)]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [62, 99, 255] },
    columnStyles: { 1: { halign: "right" } },
  });

  autoTable(doc, {
    head: [["Summary", "Amount (INR)"]],
    body: [
      ["Purchases", inr(summary.grossPurchases)],
      ["Labour", inr(summary.labour)],
      ["Establishment", inr(summary.establishment)],
      ["Electricity", inr(summary.electricity)],
      ["Gross Expenditure", inr(summary.grossExpenditure)],
      ["Less: Staff Recovery", inr(summary.staffRecovery)],
      ["Less: Day Scholar Recovery", inr(summary.dayScholarRecovery)],
      ["Net Expenditure", inr(summary.netExpenditure)],
      ["Cost / Student / Day", inr(summary.costPerStudentDay)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [62, 99, 255] },
    columnStyles: { 1: { halign: "right" } },
  });

  footer(doc);
  doc.save(`Monthly-Summary-${month}.pdf`);
}
