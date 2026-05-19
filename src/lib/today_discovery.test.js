// Unit tests for today_discovery.js utility functions. No Astro runtime needed.
import { describe, it, expect } from 'vitest';
import { fixture_today_discovery } from './fixtures/fixture_today_discovery.js';
import {
  get_latest_discovery,
  get_recent_discoveries,
} from './today_discovery.js';

// --- get_latest_discovery ---

describe('get_latest_discovery', () => {
  it('returns the entry with the most recent date from unsorted input', () => {
    const result = get_latest_discovery(fixture_today_discovery);
    expect(result.data.date).toBe('2026-05-18');
  });

  it('returns undefined for empty array', () => {
    expect(get_latest_discovery([])).toBeUndefined();
  });

  it('result has properties id, data.date, data.title, body', () => {
    const result = get_latest_discovery(fixture_today_discovery);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('data.date');
    expect(result).toHaveProperty('data.title');
    expect(result).toHaveProperty('body');
  });

  it('returns the single entry when array has exactly one element', () => {
    const result = get_latest_discovery([fixture_today_discovery[0]]);
    expect(result).toBe(fixture_today_discovery[0]);
  });
});

// --- get_recent_discoveries ---

describe('get_recent_discoveries', () => {
  it('returns array of length 3 when n=3 and 3 entries exist', () => {
    expect(get_recent_discoveries(fixture_today_discovery, 3)).toHaveLength(3);
  });

  it('returns array of length 2 when n=2 (truncation)', () => {
    expect(get_recent_discoveries(fixture_today_discovery, 2)).toHaveLength(2);
  });

  it('returns all 3 entries when n=10 exceeds total (no error)', () => {
    expect(get_recent_discoveries(fixture_today_discovery, 10)).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(get_recent_discoveries([], 5)).toEqual([]);
  });

  it('first element has the most recent date (2026-05-18)', () => {
    const result = get_recent_discoveries(fixture_today_discovery, 3);
    expect(result[0].data.date).toBe('2026-05-18');
  });

  it('last element has the oldest date (2026-05-16)', () => {
    const result = get_recent_discoveries(fixture_today_discovery, 3);
    expect(result[result.length - 1].data.date).toBe('2026-05-16');
  });

  it('first date is lexicographically greater than second (YYYY-MM-DD sort)', () => {
    const result = get_recent_discoveries(fixture_today_discovery, 3);
    expect(result[0].data.date > result[1].data.date).toBe(true);
  });
});
