import { describe, it, expect } from 'vitest';
import { validateInput, RUNTIMES } from '../api/run.js';

describe('validateInput', () => {
  it('accepts a supported language with valid code', () => {
    expect(validateInput('python', 'print(1)', RUNTIMES)).toEqual({ ok: true });
  });
  it('rejects an unsupported language with 400', () => {
    const r = validateInput('brainfuck', 'x', RUNTIMES);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });
  it('rejects non-string inputs with 400', () => {
    expect(validateInput(null, 'x', RUNTIMES).status).toBe(400);
    expect(validateInput('python', 42, RUNTIMES).status).toBe(400);
  });
  it('rejects oversized code with 413', () => {
    const big = 'x'.repeat(8001);
    expect(validateInput('python', big, RUNTIMES).status).toBe(413);
  });
});
