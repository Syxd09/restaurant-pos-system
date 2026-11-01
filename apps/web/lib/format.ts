// Dynamic currency formatting synchronized with restaurant settings.
// Uses local storage for instant hydration, and custom event dispatch for real-time reactivity.

let activeCurrency = typeof window !== "undefined" ? localStorage.getItem("nodedr_currency") || "INR" : "INR";

export const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  AED: "en-AE",
  CAD: "en-CA",
  AUD: "en-AU",
  SGD: "en-SG",
  JPY: "ja-JP",
  CNY: "zh-CN",
  CHF: "de-CH",
  BRL: "pt-BR",
  MXN: "es-MX",
};

export function getActiveCurrency(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("nodedr_currency");
    if (saved) return saved.toUpperCase();
  }
  return activeCurrency;
}

export function setActiveCurrency(currency: string | null | undefined): void {
  if (!currency) return;
  const upper = currency.trim().toUpperCase();
  if (!upper) return;
  activeCurrency = upper;
  if (typeof window !== "undefined") {
    localStorage.setItem("nodedr_currency", upper);
    window.dispatchEvent(new CustomEvent("nodedr_currency_changed", { detail: upper }));
  }
}

export function getCurrencySymbol(currency?: string): string {
  const code = (currency || getActiveCurrency() || "INR").toUpperCase();
  try {
    const loc = CURRENCY_LOCALE_MAP[code] || "en-US";
    const parts = new Intl.NumberFormat(loc, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === "currency")?.value;
    return symbol || code;
  } catch {
    return code;
  }
}

export function formatCurrency(
  value: number | string,
  currency?: string,
  locale?: string,
): string {
  const code = (currency || getActiveCurrency() || "INR").toUpperCase();
  const loc = locale || CURRENCY_LOCALE_MAP[code] || "en-US";
  const amount = typeof value === "string" ? Number(value) : value;
  const num = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(num);
}
