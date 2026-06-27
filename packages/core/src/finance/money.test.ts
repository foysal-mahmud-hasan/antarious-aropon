import { describe, expect, it } from 'vitest';
import { balancePoisha, summarize, takaToPoisha } from './money';

describe('money (integer poisha, no float drift)', () => {
  it('converts taka to poisha without rounding error', () => {
    expect(takaToPoisha(199.99)).toBe(19999);
    expect(takaToPoisha(0.1)).toBe(10);
  });

  it('computes signed balance and summary', () => {
    const entries = [
      { type: 'income' as const, amountPoisha: 50000 },
      { type: 'expense' as const, amountPoisha: 12500 },
      { type: 'income' as const, amountPoisha: 2500 },
    ];
    expect(balancePoisha(entries)).toBe(40000);
    expect(summarize(entries)).toEqual({
      incomePoisha: 52500,
      expensePoisha: 12500,
      profitPoisha: 40000,
    });
  });
});
