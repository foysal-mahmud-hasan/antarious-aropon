/**
 * Money helpers. The canonical unit is INTEGER POISHA (1 BDT = 100 poisha).
 * Never use floats for money. Formatting for display lives in `@aropon/i18n`.
 */
export const POISHA_PER_TAKA = 100;

export function takaToPoisha(taka: number): number {
  return Math.round(taka * POISHA_PER_TAKA);
}

export function poishaToTaka(poisha: number): number {
  return poisha / POISHA_PER_TAKA;
}

export function sumPoisha(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export type LedgerEntry = { type: 'income' | 'expense'; amountPoisha: number };

/** Signed running total in poisha: income adds, expense subtracts. */
export function balancePoisha(entries: readonly LedgerEntry[]): number {
  return entries.reduce(
    (acc, e) => acc + (e.type === 'income' ? e.amountPoisha : -e.amountPoisha),
    0,
  );
}

export type FinanceSummary = {
  incomePoisha: number;
  expensePoisha: number;
  profitPoisha: number;
};

export function summarize(entries: readonly LedgerEntry[]): FinanceSummary {
  let incomePoisha = 0;
  let expensePoisha = 0;
  for (const e of entries) {
    if (e.type === 'income') incomePoisha += e.amountPoisha;
    else expensePoisha += e.amountPoisha;
  }
  return { incomePoisha, expensePoisha, profitPoisha: incomePoisha - expensePoisha };
}
