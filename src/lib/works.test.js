// Unit tests for works.js utility functions. No Astro runtime needed.
import { describe, it, expect } from 'vitest';
import { fixture_works } from './fixtures/fixture_works.js';
import {
  get_works_by_category,
  has_works,
  get_latest_work,
} from './works.js';

// --- get_works_by_category ---

describe('get_works_by_category', () => {
  it('returns array of length 2 for game category', () => {
    expect(get_works_by_category(fixture_works, 'game')).toHaveLength(2);
  });

  it('returns array of length 1 for asset category', () => {
    expect(get_works_by_category(fixture_works, 'asset')).toHaveLength(1);
  });

  it('returns array of length 1 for book category', () => {
    expect(get_works_by_category(fixture_works, 'book')).toHaveLength(1);
  });

  it('returns empty array for project category (no entries)', () => {
    expect(get_works_by_category(fixture_works, 'project')).toEqual([]);
  });

  it('returns empty array for empty entries', () => {
    expect(get_works_by_category([], 'game')).toEqual([]);
  });

  it('game results sorted descending by published_at — first is Meow Adventure (2026-03-01)', () => {
    const result = get_works_by_category(fixture_works, 'game');
    expect(result[0].data.title).toBe('Meow Adventure');
  });

  it('every entry in game result has data.category === game (no cross-category leakage)', () => {
    const result = get_works_by_category(fixture_works, 'game');
    for (const item of result) {
      expect(item.data.category).toBe('game');
    }
  });
});

// --- has_works ---

describe('has_works', () => {
  it('returns true for game category', () => {
    expect(has_works(fixture_works, 'game')).toBe(true);
  });

  it('returns true for asset category', () => {
    expect(has_works(fixture_works, 'asset')).toBe(true);
  });

  it('returns false for project category (no entries)', () => {
    expect(has_works(fixture_works, 'project')).toBe(false);
  });

  it('returns false for empty entries', () => {
    expect(has_works([], 'game')).toBe(false);
  });
});

// --- get_latest_work ---

describe('get_latest_work', () => {
  it('returns Meow Adventure as latest game (published_at 2026-03-01)', () => {
    const result = get_latest_work(fixture_works, 'game');
    expect(result.data.title).toBe('Meow Adventure');
  });

  it('returns undefined for project category (no entries)', () => {
    expect(get_latest_work(fixture_works, 'project')).toBeUndefined();
  });

  it('returns undefined for empty entries', () => {
    expect(get_latest_work([], 'game')).toBeUndefined();
  });
});
