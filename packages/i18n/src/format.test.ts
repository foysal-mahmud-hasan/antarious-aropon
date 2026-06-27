import { describe, expect, it } from 'vitest';
import { formatBDT, groupSouthAsian, toBengaliDigits } from './format';

describe('Bengali-first formatting', () => {
  it('converts digits to Bengali numerals', () => {
    expect(toBengaliDigits('2026')).toBe('২০২৬');
  });

  it('groups numbers South-Asian style (lakh/crore)', () => {
    expect(groupSouthAsian('1234567')).toBe('12,34,567');
    expect(groupSouthAsian('999')).toBe('999');
  });

  it('formats poisha as Taka in bn and en', () => {
    expect(formatBDT(4000000, 'en')).toBe('৳ 40,000.00');
    expect(formatBDT(4000000, 'bn')).toBe('৳ ৪০,০০০.০০');
    expect(formatBDT(-12550, 'en')).toBe('-৳ 125.50');
  });
});
