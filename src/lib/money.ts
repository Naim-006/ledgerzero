import { getCurrencyDecimals } from "@/domain/countries";

/**
 * Format integer minor units (e.g., 2000000 cents) into a localized currency string ($20,000.00)
 */
export function formatMinorUnits(
  minorUnits: number,
  currency: string = "USD",
  locale: string = "en-US",
  options?: { showPlusSign?: boolean; hideDecimalsIfZero?: boolean }
): string {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  const majorValue = minorUnits / factor;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: options?.hideDecimalsIfZero && Number.isInteger(majorValue) ? 0 : decimals,
      maximumFractionDigits: decimals,
      signDisplay: options?.showPlusSign ? "always" : "auto",
    });
    return formatter.format(majorValue);
  } catch {
    // Fallback if locale or currency code is unsupported in environment
    const sign = minorUnits < 0 ? "-" : options?.showPlusSign ? "+" : "";
    const absValue = (Math.abs(minorUnits) / factor).toFixed(decimals);
    return `${sign}${currency.toUpperCase()} ${absValue}`;
  }
}

/**
 * Parse user decimal string (e.g. "1250.50") safely into integer minor units without floating point drift
 */
export function parseDecimalToMinorUnits(valueStr: string, currency: string = "USD"): number {
  if (!valueStr || valueStr.trim() === "") return 0;

  const decimals = getCurrencyDecimals(currency);
  // Clean string: remove currency symbols and thousands separators
  const cleanStr = valueStr.replace(/[^0-9.-]/g, "");
  if (!cleanStr || cleanStr === "-" || cleanStr === ".") return 0;

  const isNegative = cleanStr.startsWith("-");
  const absStr = isNegative ? cleanStr.substring(1) : cleanStr;

  const [wholePart, fracPart = ""] = absStr.split(".");
  const paddedFrac = (fracPart + "0".repeat(decimals)).slice(0, decimals);

  const whole = parseInt(wholePart || "0", 10);
  const frac = decimals > 0 ? parseInt(paddedFrac || "0", 10) : 0;

  const total = whole * Math.pow(10, decimals) + frac;
  return isNegative ? -total : total;
}

/**
 * Format minor units as a plain number string for input fields (e.g. 2000000 cents -> "20000.00")
 */
export function minorUnitsToDecimalString(minorUnits: number, currency: string = "USD"): string {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  return (minorUnits / factor).toFixed(decimals);
}
