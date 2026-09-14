import { useCompanySettings } from '@/features/company/hooks/use-org-queries';
import { getCurrencySymbol, formatCurrency, getCurrencyInfo } from '@/lib/currency';

export function useCurrency() {
  const { data: settings } = useCompanySettings();
  const currencyCode = settings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currencyCode);
  const currencyInfo = getCurrencyInfo(currencyCode);

  const format = (amount: number | string | null | undefined) => {
    return formatCurrency(amount, currencyCode);
  };

  return {
    currencyCode,
    currencySymbol,
    currencyInfo,
    formatCurrency: format,
  };
}
