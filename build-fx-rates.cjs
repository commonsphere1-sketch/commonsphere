#!/usr/bin/env node
/**
 * Builds src/data/fxRates.ts - the exchange rates the Economies page's currency converter uses.
 *
 * What this replaces. The converter carried rates typed into the page "vs USD (Aug 2026 approx.)": a dollar at 83.5
 * Indian rupees, 0.921 euros, 149.8 yen. Nothing said where they came from, and they were far out - on the European
 * Central Bank's reference rates of 20 November 2026 the dollar bought 92.67 rupees, 0.910 euros and 158.6 yen.
 *
 * Sources. Two official publishers, each read as it gives its figures:
 *
 *   European Central Bank,    the euro reference rates, published each working day at about 16:00 CET:
 *     euro foreign exchange   how many of 29 currencies one euro buys. A rate against the dollar is worked
 *     reference rates         out here, through the euro: a currency's euro rate over the dollar's.
 *                             Reuse is free with the source acknowledged.
 *   US Treasury, Treasury     for the currencies the ECB does not publish (the dirham, the naira, the
 *     Reporting Rates of      rouble and others): how many of each one dollar buys, set each quarter and
 *     Exchange                amended within it when a rate moves by 10% or more. Public domain.
 *
 * Every rate keeps the figure as published, its publisher and its date, so the page can say which it used. A
 * currency the page lists that neither publishes stops the build.
 *
 *   node build-fx-rates.cjs
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "src/data/fxRates.ts");
const UA = "CommonSphere-build/1.0 (https://commonsphere.vercel.app)";
const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const ECB_PAGE = "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html";
const TREASURY_API = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange";
const TREASURY_PAGE = "https://fiscaldata.treasury.gov/datasets/treasury-reporting-rates-exchange/treasury-reporting-rates-of-exchange";

/** The page's currencies and their names, in the order its list gives them. */
const CURRENCIES = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", CNY: "Chinese Yuan", INR: "Indian Rupee",
  BRL: "Brazilian Real", CAD: "Canadian Dollar", AUD: "Australian Dollar", KRW: "South Korean Won", RUB: "Russian Ruble",
  MXN: "Mexican Peso", IDR: "Indonesian Rupiah", CHF: "Swiss Franc", ARS: "Argentine Peso", AED: "UAE Dirham",
  SAR: "Saudi Riyal", TRY: "Turkish Lira", PLN: "Polish Złoty", SEK: "Swedish Krona", DKK: "Danish Krone",
  NOK: "Norwegian Krone", SGD: "Singapore Dollar", MYR: "Malaysian Ringgit", ILS: "Israeli Shekel", EGP: "Egyptian Pound",
  ZAR: "South African Rand", THB: "Thai Baht", NGN: "Nigerian Naira", PKR: "Pakistani Rupee", VND: "Vietnamese Dong",
  CLP: "Chilean Peso", PHP: "Philippine Peso", BDT: "Bangladeshi Taka", NZD: "New Zealand Dollar", HUF: "Hungarian Forint",
  CZK: "Czech Koruna", RON: "Romanian Leu", UAH: "Ukrainian Hryvnia", KWD: "Kuwaiti Dinar", QAR: "Qatari Riyal",
  TWD: "Taiwan Dollar", HKD: "Hong Kong Dollar", KZT: "Kazakhstani Tenge", MMK: "Myanmar Kyat", LKR: "Sri Lankan Rupee",
  ISK: "Icelandic Króna",
};

/** The Treasury's name for each currency the ECB does not publish, exactly as its table gives it. */
const TREASURY_NAMES = {
  RUB: "Russia-Ruble", ARS: "Argentina-Peso", AED: "United Arab Emirates-Dirham", SAR: "Saudi Arabia-Riyal",
  EGP: "Egypt-Pound", NGN: "Nigeria-Naira", PKR: "Pakistan-Rupee", VND: "Vietnam-Dong", CLP: "Chile-Peso",
  BDT: "Bangladesh-Taka", UAH: "Ukraine-Hryvnia", KWD: "Kuwait-Dinar", QAR: "Qatar-Riyal", TWD: "Taiwan-Dollar",
  KZT: "Kazakhstan-Tenge", MMK: "Myanmar-Kyat", LKR: "Sri Lanka-Rupee",
};

/** Six significant figures: more than either publisher gives. */
const sig = (v) => Number(v.toPrecision(6));

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return { text: await res.text(), date: res.headers.get("date") };
}

(async () => {
  // The ECB's day.
  const ecb = await get(ECB_URL);
  const day = /<Cube time='(\d{4}-\d{2}-\d{2})'>/.exec(ecb.text);
  if (!day) throw new Error("The ECB file has no day");
  const perEuro = {};
  for (const m of ecb.text.matchAll(/<Cube currency='([A-Z]{3})' rate='([\d.]+)'\/>/g)) perEuro[m[1]] = Number(m[2]);
  if (!perEuro.USD) throw new Error("The ECB file has no dollar rate");

  // The Treasury's latest quarter and any amendment since: the newest effective rate of each currency.
  const latest = JSON.parse((await get(`${TREASURY_API}?fields=record_date&sort=-record_date&page%5Bsize%5D=1`)).text).data[0].record_date;
  const rows = JSON.parse(
    (await get(`${TREASURY_API}?fields=country_currency_desc,exchange_rate,record_date,effective_date&filter=record_date:eq:${latest}&page%5Bsize%5D=1000`)).text,
  ).data;
  const treasury = {};
  for (const r of rows) {
    const had = treasury[r.country_currency_desc];
    if (!had || r.effective_date > had.effective_date) treasury[r.country_currency_desc] = r;
  }

  const rates = {};
  for (const code of Object.keys(CURRENCIES)) {
    if (code === "USD") {
      rates.USD = { perUsd: 1, source: "base", date: day[1] };
    } else if (code === "EUR") {
      // One euro buys perEuro.USD dollars; a dollar buys its inverse in euros.
      rates.EUR = { perUsd: sig(1 / perEuro.USD), source: "ECB", date: day[1], published: perEuro.USD, publishedAs: "USD per EUR" };
    } else if (perEuro[code]) {
      rates[code] = { perUsd: sig(perEuro[code] / perEuro.USD), source: "ECB", date: day[1], published: perEuro[code], publishedAs: `${code} per EUR` };
    } else if (TREASURY_NAMES[code] && treasury[TREASURY_NAMES[code]]) {
      const r = treasury[TREASURY_NAMES[code]];
      rates[code] = { perUsd: Number(r.exchange_rate), source: "Treasury", date: r.effective_date, published: Number(r.exchange_rate), publishedAs: `${code} per USD` };
    } else {
      throw new Error(`No published rate for ${code}`);
    }
  }

  const built = new Date(ecb.date || Date.now()).toISOString().slice(0, 10);
  const lines = Object.entries(rates).map(([code, r]) => `  ${code}: ${JSON.stringify({ name: CURRENCIES[code], ...r })},`);
  const out = `// GENERATED by build-fx-rates.cjs on ${built} - do not edit by hand.
// Sources: European Central Bank, euro foreign exchange reference rates (${ECB_PAGE}), ${day[1]};
// US Treasury, Treasury Reporting Rates of Exchange (${TREASURY_PAGE}), quarter of ${latest}.

/** Where a rate is from: the ECB's euro reference rates (a dollar rate worked out through the euro), the US Treasury's
 *  reporting rates, or the dollar itself. */
export type FxSource = "ECB" | "Treasury" | "base";

export interface FxRate {
  name: string;
  /** How many of the currency one US dollar buys. */
  perUsd: number;
  source: FxSource;
  /** The day the rate is for. */
  date: string;
  /** The figure as its publisher gives it, and what it is. */
  published?: number;
  publishedAs?: string;
}

export const FX_ECB_DATE = ${JSON.stringify(day[1])};
export const FX_TREASURY_DATE = ${JSON.stringify(latest)};
export const FX_SOURCES = {
  ECB: { name: "European Central Bank, euro reference rates", url: ${JSON.stringify(ECB_PAGE)} },
  Treasury: { name: "US Treasury, Reporting Rates of Exchange", url: ${JSON.stringify(TREASURY_PAGE)} },
} as const;

export const FX_RATES: Record<string, FxRate> = {
${lines.join("\n")}
};
`;
  fs.writeFileSync(OUT, out);
  const by = (s) => Object.entries(rates).filter(([, r]) => r.source === s).map(([c]) => c);
  console.log(`ECB ${day[1]}: ${by("ECB").join(" ")}`);
  console.log(`Treasury ${latest}: ${by("Treasury").join(" ")}`);
  console.log(`USD/INR ${rates.INR.perUsd}, USD/EUR ${rates.EUR.perUsd}, USD/JPY ${rates.JPY.perUsd}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
