/**
 * Currency Formatting Utilities
 * Provides locale-aware currency formatting for international use
 */

export interface CurrencyConfig {
  code: string;      // ISO 4217 code: "INR", "USD", "EUR"
  symbol: string;    // Display symbol: "₹", "$", "€"
  locale: string;    // BCP 47 locale: "en-IN", "en-US"
}

// Common currency configurations
export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
  CAD: { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
};

// Default currency (India)
export const DEFAULT_CURRENCY = CURRENCIES.INR;

/**
 * Format amount with currency symbol using locale-aware formatting
 * @param amount - The numeric amount to format
 * @param currencySymbol - The currency symbol to use (defaults to ₹)
 * @param locale - The locale for number formatting (defaults to en-IN)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currencySymbol: string = DEFAULT_CURRENCY.symbol,
  locale: string = DEFAULT_CURRENCY.locale
): string => {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currencySymbol}${formatted}`;
};

/**
 * Format amount using ISO currency code (uses Intl.NumberFormat currency style)
 * @param amount - The numeric amount to format
 * @param currencyCode - ISO 4217 currency code (defaults to INR)
 * @param locale - The locale for formatting (auto-detected from currency if not provided)
 * @returns Formatted currency string
 */
export const formatCurrencyByCode = (
  amount: number,
  currencyCode: string = 'INR',
  locale?: string
): string => {
  const currency = CURRENCIES[currencyCode] || DEFAULT_CURRENCY;
  const formatLocale = locale || currency.locale;
  
  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: currency.code,
  }).format(amount);
};

/**
 * Get currency configuration by code
 * @param code - ISO 4217 currency code
 * @returns Currency configuration or default (INR)
 */
export const getCurrencyConfig = (code: string): CurrencyConfig => {
  return CURRENCIES[code] || DEFAULT_CURRENCY;
};
