/** ISO 4217 code, e.g. "INR". */
export type Currency = string;

/** Number of minor-unit digits for a currency (INR → 2, JPY → 0). */
function minorDigits(currency: Currency): number {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
}

/**
 * Converts a user-typed decimal amount ("12.34") into integer minor units (1234).
 * Works on the string, so no floating-point rounding is involved.
 */
export function toMinorUnits(amount: string, currency: Currency): number {
  const digits = minorDigits(currency);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!match) throw new Error(`Not a valid amount: "${amount}"`);
  const [, whole = "", fraction = ""] = match;
  if (fraction.length > digits) {
    throw new Error(`${currency} amounts allow at most ${digits} decimal places`);
  }
  return Number(whole + fraction.padEnd(digits, "0"));
}

/** Formats integer minor units for display, e.g. 1234 INR → "₹12.34". */
export function formatMoney(minor: number, currency: Currency, locale = "en-IN"): string {
  const digits = minorDigits(currency);
  const sign = minor < 0 ? "-" : "";
  const abs = String(Math.abs(minor)).padStart(digits + 1, "0");
  const decimal =
    digits === 0 ? abs : `${abs.slice(0, -digits)}.${abs.slice(-digits)}`;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    `${sign}${decimal}` as Intl.StringNumericLiteral,
  );
}
