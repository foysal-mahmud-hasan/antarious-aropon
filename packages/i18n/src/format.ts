export type Locale = 'bn' | 'en';

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Convert ASCII digits in a string to Bengali numerals (০-৯). Non-digits pass through. */
export function toBengaliDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]!);
}

/** Group an integer string in the South-Asian (lakh/crore) style: 12,34,567. */
export function groupSouthAsian(intStr: string): string {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  let rest = intStr.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}

/**
 * Format integer poisha as Bangladeshi Taka. Default locale `bn` renders Bengali numerals.
 * 4000000 poisha → "৳ ৪০,০০০.০০" (bn) / "৳ 40,000.00" (en).
 */
export function formatBDT(poisha: number, locale: Locale = 'bn'): string {
  const negative = poisha < 0;
  const abs = Math.abs(poisha);
  const taka = Math.floor(abs / 100);
  const paisa = abs % 100;
  let amount = `${groupSouthAsian(String(taka))}.${String(paisa).padStart(2, '0')}`;
  if (locale === 'bn') amount = toBengaliDigits(amount);
  return `${negative ? '-' : ''}৳ ${amount}`;
}

/** Locale-aware date format (uses full-ICU Intl). Falls back to ISO date on failure. */
export function formatDate(iso: string, locale: Locale = 'bn'): string {
  try {
    const fmt = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return fmt.format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
