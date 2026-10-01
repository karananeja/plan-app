import { z } from "zod";

const knownCurrencies = new Set(Intl.supportedValuesOf("currency"));

/** An ISO 4217 currency code the runtime knows, e.g. "INR". */
export const currencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, e.g. INR")
  .refine((code) => knownCurrencies.has(code), "Unknown currency");

export const updateProfileInput = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  currency: currencyCode.optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

const EURO_REGIONS = "AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK".split(" ");

const CURRENCY_BY_REGION: Record<string, string> = {
  ...Object.fromEntries(EURO_REGIONS.map((r) => [r, "EUR"])),
  AE: "AED", AU: "AUD", BD: "BDT", BR: "BRL", CA: "CAD", CH: "CHF", CN: "CNY",
  GB: "GBP", HK: "HKD", ID: "IDR", IN: "INR", JP: "JPY", KR: "KRW", LK: "LKR",
  MX: "MXN", MY: "MYR", NP: "NPR", NZ: "NZD", PH: "PHP", PK: "PKR", QA: "QAR",
  SA: "SAR", SE: "SEK", SG: "SGD", TH: "THB", US: "USD", VN: "VND", ZA: "ZAR",
};

/**
 * A sensible default profile currency for a browser locale, e.g. "en-IN" → "INR".
 * A locale without a region uses its most likely region ("hi" → India). Falls back to USD.
 */
export function currencyForLocale(locale: string): string {
  let region: string | undefined;
  try {
    region = new Intl.Locale(locale).maximize().region;
  } catch {
    region = undefined;
  }
  return (region && CURRENCY_BY_REGION[region]) ?? "USD";
}
