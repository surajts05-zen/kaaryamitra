export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD - $)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR - €)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP - £)', locale: 'en-GB' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR - ₹)', locale: 'en-IN' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD - CA$)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD - A$)', locale: 'en-AU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY - ¥)', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (CNY - ¥)', locale: 'zh-CN' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD - S$)', locale: 'en-SG' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', locale: 'ar-AE' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal (SAR)', locale: 'ar-SA' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)', locale: 'de-CH' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (MYR)', locale: 'ms-MY' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real (BRL - R$)', locale: 'pt-BR' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand (ZAR - R)', locale: 'en-ZA' },
];

export function getCurrencyInfo(code = 'USD'): CurrencyOption {
  const found = CURRENCIES.find((c) => c.code === code);
  return found || CURRENCIES[0]!;
}

export function getCurrencySymbol(code = 'USD'): string {
  return getCurrencyInfo(code).symbol;
}

export function formatCurrency(amount: number | string | null | undefined, currencyCode = 'USD'): string {
  const num = Number(amount) || 0;
  const curr = getCurrencyInfo(currencyCode);
  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${curr.symbol}${num.toLocaleString()}`;
  }
}
