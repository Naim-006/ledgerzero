export interface CountryConfig {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  defaultCurrency: string; // ISO 4217
  currencySymbol: string;
  minorUnitDecimals: number; // 2 for USD/EUR/BDT, 0 for JPY, 3 for KWD
  locale: string;
  timeZone: string;
  weekStartDay: 0 | 1; // 0 for Sunday, 1 for Monday
  fiscalYearStartMonth: number; // 1-12
  taxLabel: string;
  defaultTaxRatePercent: number;
  commonPaymentTermsDays: number[];
  commonPaymentMethods: string[];
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  US: {
    code: "US",
    name: "United States",
    defaultCurrency: "USD",
    currencySymbol: "$",
    minorUnitDecimals: 2,
    locale: "en-US",
    timeZone: "America/New_York",
    weekStartDay: 0,
    fiscalYearStartMonth: 1,
    taxLabel: "Sales Tax",
    defaultTaxRatePercent: 8.5,
    commonPaymentTermsDays: [15, 30, 45, 60],
    commonPaymentMethods: ["ACH Transfer", "Credit Card", "Wire Transfer", "Check"],
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    defaultCurrency: "GBP",
    currencySymbol: "£",
    minorUnitDecimals: 2,
    locale: "en-GB",
    timeZone: "Europe/London",
    weekStartDay: 1,
    fiscalYearStartMonth: 4,
    taxLabel: "VAT",
    defaultTaxRatePercent: 20.0,
    commonPaymentTermsDays: [14, 30, 60],
    commonPaymentMethods: ["BACS", "Faster Payments", "Direct Debit", "Card"],
  },
  EU: {
    code: "EU",
    name: "European Union",
    defaultCurrency: "EUR",
    currencySymbol: "€",
    minorUnitDecimals: 2,
    locale: "de-DE",
    timeZone: "Europe/Berlin",
    weekStartDay: 1,
    fiscalYearStartMonth: 1,
    taxLabel: "VAT",
    defaultTaxRatePercent: 19.0,
    commonPaymentTermsDays: [14, 30, 60],
    commonPaymentMethods: ["SEPA Credit Transfer", "SEPA Direct Debit", "Card"],
  },
  IN: {
    code: "IN",
    name: "India",
    defaultCurrency: "INR",
    currencySymbol: "₹",
    minorUnitDecimals: 2,
    locale: "en-IN",
    timeZone: "Asia/Kolkata",
    weekStartDay: 1,
    fiscalYearStartMonth: 4,
    taxLabel: "GST",
    defaultTaxRatePercent: 18.0,
    commonPaymentTermsDays: [15, 30, 45],
    commonPaymentMethods: ["NEFT / RTGS", "UPI", "IMPS", "Net Banking"],
  },
  SG: {
    code: "SG",
    name: "Singapore",
    defaultCurrency: "SGD",
    currencySymbol: "S$",
    minorUnitDecimals: 2,
    locale: "en-SG",
    timeZone: "Asia/Singapore",
    weekStartDay: 1,
    fiscalYearStartMonth: 1,
    taxLabel: "GST",
    defaultTaxRatePercent: 9.0,
    commonPaymentTermsDays: [15, 30, 45],
    commonPaymentMethods: ["PayNow", "FAST", "GIRO", "Wire Transfer"],
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    defaultCurrency: "NGN",
    currencySymbol: "₦",
    minorUnitDecimals: 2,
    locale: "en-NG",
    timeZone: "Africa/Lagos",
    weekStartDay: 1,
    fiscalYearStartMonth: 1,
    taxLabel: "VAT",
    defaultTaxRatePercent: 7.5,
    commonPaymentTermsDays: [14, 30, 60],
    commonPaymentMethods: ["NIBSS Instant Payment", "Bank Transfer", "Card"],
  },
  BR: {
    code: "BR",
    name: "Brazil",
    defaultCurrency: "BRL",
    currencySymbol: "R$",
    minorUnitDecimals: 2,
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    weekStartDay: 0,
    fiscalYearStartMonth: 1,
    taxLabel: "Impostos",
    defaultTaxRatePercent: 12.0,
    commonPaymentTermsDays: [15, 28, 30],
    commonPaymentMethods: ["PIX", "Boleto Bancário", "TED", "Cartão"],
  },
  BD: {
    code: "BD",
    name: "Bangladesh",
    defaultCurrency: "BDT",
    currencySymbol: "৳",
    minorUnitDecimals: 2,
    locale: "bn-BD",
    timeZone: "Asia/Dhaka",
    weekStartDay: 0,
    fiscalYearStartMonth: 7,
    taxLabel: "VAT",
    defaultTaxRatePercent: 15.0,
    commonPaymentTermsDays: [15, 30, 45],
    commonPaymentMethods: ["bKash / Nagad", "BEFTN / NPSB", "Cheque", "RTGS"],
  },
};

export const DEFAULT_COUNTRY = COUNTRY_CONFIGS.US;

export function getCountryConfig(countryCode: string): CountryConfig {
  return COUNTRY_CONFIGS[countryCode.toUpperCase()] || DEFAULT_COUNTRY;
}

export function getCurrencyDecimals(currencyCode: string): number {
  switch (currencyCode.toUpperCase()) {
    case "JPY":
    case "KRW":
    case "VND":
    case "CLP":
      return 0;
    case "KWD":
    case "BHD":
    case "OMR":
    case "JOD":
      return 3;
    default:
      return 2;
  }
}
