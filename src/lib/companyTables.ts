/**
 * How the tables of companies (topCompanies.ts) are named, and a company's revenue in one unit where its table allows:
 * shared by an economy's window and the Dashboard explorer's Industry tab.
 */
import { TOP_COMPANY_LISTS, type TopCompany } from "../data/topCompanies";

type CompanyTable = (typeof TOP_COMPANY_LISTS)[number];

/** A table by its page's title and its year: the heading's own words where they name the year ("2024 Fortune list"), else its edition. */
export const tableName = (l: CompanyTable) =>
  `${l.title.replace(/^List of /, "the list of ")}${/\b20\d\d\b/.test(l.section) ? `, ${l.section}` : l.edition ? `, ${l.edition}` : ""}`;

/**
 * A company's revenue in billions of US dollars, worked out from its table's millions or billions of US dollars; null
 * where its table counts in another currency or writes it as anything but a number.
 */
export function usdBillions(c: TopCompany): number | null {
  if (!c.revenue || !c.unit || !/US\$|USD/i.test(c.unit)) return null;
  const m = c.revenue.replace(/^[|\s$]+/, "").match(/^(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?$/);
  if (!m) return null;
  const v = Number(`${m[1].replace(/,/g, "")}${m[2] ?? ""}`);
  if (!(v > 0)) return null;
  return /million/i.test(c.unit) ? v / 1000 : /billion/i.test(c.unit) ? v : null;
}
