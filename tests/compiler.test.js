import { describe, it, expect } from 'vitest';
import { normalize, matchesExpected, runJS } from '../src/features/compiler.js';

describe('normalize', () => {
  it('trims trailing whitespace per line and trailing newlines', () => {
    expect(normalize('hi  \nworld\n\n')).toBe('hi\nworld');
  });
  it('normalizes CRLF', () => {
    expect(normalize('a\r\nb')).toBe('a\nb');
  });
});

describe('matchesExpected', () => {
  it('matches identical normalized output', () => {
    expect(matchesExpected('Hello, World!\n', 'Hello, World!')).toBe(true);
  });
  it('ignores trailing whitespace differences', () => {
    expect(matchesExpected('x   \ny', 'x\ny')).toBe(true);
  });
  it('returns true when there is no expected output', () => {
    expect(matchesExpected('anything', '')).toBe(true);
  });
  it('returns false on a real mismatch', () => {
    expect(matchesExpected('5', '6')).toBe(false);
  });
});

describe('runJS', () => {
  it('captures console.log output', () => {
    const r = runJS('console.log("hi"); console.log(1, 2);');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toBe('hi\n1 2');
    expect(r.stderr).toBe('');
  });
  it('routes console.error to stderr', () => {
    const r = runJS('console.error("boom");');
    expect(r.stderr).toBe('boom');
  });
  it('stringifies objects', () => {
    const r = runJS('console.log({a:1});');
    expect(r.stdout).toBe('{"a":1}');
  });
  it('captures syntax errors with exitCode 1', () => {
    const r = runJS('console.log(');
    expect(r.exitCode).toBe(1);
    expect(r.stderr.length).toBeGreaterThan(0);
  });
  it('captures runtime errors with exitCode 1', () => {
    const r = runJS('throw new Error("nope");');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('nope');
  });
});
