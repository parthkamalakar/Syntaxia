import { describe, it, expect } from 'vitest';
import { recordActivity, daysBetween } from '../src/state.js';

describe('daysBetween', () => {
  it('returns 0 for same day', () => {
    expect(daysBetween('2026-07-22', '2026-07-22')).toBe(0);
  });
  it('returns 1 for a consecutive day', () => {
    expect(daysBetween('2026-07-22', '2026-07-23')).toBe(1);
  });
  it('counts across a month boundary', () => {
    expect(daysBetween('2026-07-31', '2026-08-03')).toBe(3);
  });
});

describe('recordActivity streak logic', () => {
  const baseP = () => ({ done: {}, xp: 0, str: 0, lastActive: null });

  it('first ever activity sets streak to 1', () => {
    const p = recordActivity(baseP(), '2026-07-22');
    expect(p.str).toBe(1);
    expect(p.lastActive).toBe('2026-07-22');
  });

  it('same-day activity does not increment streak', () => {
    const p = recordActivity({ ...baseP(), str: 3, lastActive: '2026-07-22' }, '2026-07-22');
    expect(p.str).toBe(3);
  });

  it('consecutive day increments streak', () => {
    const p = recordActivity({ ...baseP(), str: 3, lastActive: '2026-07-21' }, '2026-07-22');
    expect(p.str).toBe(4);
    expect(p.lastActive).toBe('2026-07-22');
  });

  it('a gap resets streak to 1', () => {
    const p = recordActivity({ ...baseP(), str: 5, lastActive: '2026-07-19' }, '2026-07-22');
    expect(p.str).toBe(1);
    expect(p.lastActive).toBe('2026-07-22');
  });
});
