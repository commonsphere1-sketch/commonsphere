/**
 * A chart's figures as a spreadsheet, for a reader's own work, as asked: every chart that can say what it shows can be
 * downloaded as it is drawn - its rows, each figure as printed and as a number, and the page it came from. Made in the
 * browser; nothing is sent anywhere.
 */
export type CsvCell = string | number | null | undefined;

/** A printed figure's number, where it reads as one ("12.5%", "$1,257", "41.8 · 2024" - its first number). */
export const numberOf = (s: string): number | null => {
  const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

/** A cell as CSV writes it: quoted, its quotes doubled. */
const cell = (v: CsvCell) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** A file's name from what the chart shows: plain letters and dashes, and the day. */
export const csvName = (what: string) =>
  `${
    what
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "chart"
  }-${new Date().toISOString().slice(0, 10)}.csv`;

/** Downloads rows as a CSV file, a header first, with a note of the page it came from as its last line. */
export function downloadCsv(name: string, header: string[], rows: CsvCell[][]) {
  const from = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
  const lines = [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(",")), "", cell(`From CommonSphere, ${from}, downloaded ${new Date().toISOString().slice(0, 10)}; the chart's sources are given beside it on the page.`)];
  const url = URL.createObjectURL(new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".csv") ? name : csvName(name);
  a.click();
  URL.revokeObjectURL(url);
}
