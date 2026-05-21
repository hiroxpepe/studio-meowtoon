// Unit tests for comic.js utility functions. Uses fixture data — no Astro runtime needed.
import { describe, it, expect } from 'vitest';
import { fixture_entries } from './fixtures/fixture_entries.js';
import { top_page_series, series_titles, series_covers } from './series_meta.js';
import {
  parse_entry_id,
  get_series_list,
  get_all_episodes,
  get_episode,
  get_prev_episode,
  get_next_episode,
  build_top_page_data,
  build_series_paths,
  build_episode_paths,
  build_episode_nav,
} from './comic.js';

// --- parse_entry_id ---

describe('parse_entry_id', () => {
  it('parses ja/everyday/001 correctly', () => {
    expect(parse_entry_id('ja/everyday/001')).toEqual({ lang: 'ja', series: 'everyday', episode_id: '001' });
  });

  it('parses ja/storyboard/096 correctly', () => {
    expect(parse_entry_id('ja/storyboard/096')).toEqual({ lang: 'ja', series: 'storyboard', episode_id: '096' });
  });

  it('result has exactly keys lang, series, episode_id', () => {
    const result = parse_entry_id('ja/everyday/001');
    expect(Object.keys(result).sort()).toEqual(['episode_id', 'lang', 'series']);
  });
});

// --- get_series_list ---

describe('get_series_list', () => {
  it('returns unique sorted series for ja', () => {
    expect(get_series_list(fixture_entries, 'ja')).toEqual(['everyday', 'lusiphite', 'storyboard']);
  });

  it('returns empty array for en (no en entries in fixture)', () => {
    expect(get_series_list(fixture_entries, 'en')).toEqual([]);
  });

  it('returns empty array for empty entries', () => {
    expect(get_series_list([], 'ja')).toEqual([]);
  });
});

// --- get_all_episodes ---

describe('get_all_episodes', () => {
  it('returns 3 entries for ja/everyday', () => {
    expect(get_all_episodes(fixture_entries, 'ja', 'everyday')).toHaveLength(3);
  });

  it('returns entries sorted ascending by episode', () => {
    const eps = get_all_episodes(fixture_entries, 'ja', 'everyday');
    expect(eps[0].data.episode).toBe('001');
    expect(eps[eps.length - 1].data.episode).toBe('003');
  });

  it('returns empty array for unknown series', () => {
    expect(get_all_episodes(fixture_entries, 'ja', 'unknown')).toEqual([]);
  });

  it('returns empty array for empty entries', () => {
    expect(get_all_episodes([], 'ja', 'everyday')).toEqual([]);
  });
});

// --- get_episode ---

describe('get_episode', () => {
  it('returns entry with matching id', () => {
    const entry = get_episode(fixture_entries, 'ja', 'everyday', '001');
    expect(entry.id).toBe('ja/everyday/001');
  });

  it('returns undefined for non-existent episode', () => {
    expect(get_episode(fixture_entries, 'ja', 'everyday', '999')).toBeUndefined();
  });

  it('data.episode matches episode_id param (D9 verification)', () => {
    const entry = get_episode(fixture_entries, 'ja', 'everyday', '001');
    expect(entry.data.episode).toBe('001');
  });
});

// --- get_prev_episode ---

describe('get_prev_episode', () => {
  it('returns episode 002 as prev of 003', () => {
    const prev = get_prev_episode(fixture_entries, 'ja', 'everyday', '003');
    expect(prev.data.episode).toBe('002');
  });

  it('returns null for first episode (001)', () => {
    expect(get_prev_episode(fixture_entries, 'ja', 'everyday', '001')).toBeNull();
  });

  it('returns null for first episode in storyboard', () => {
    expect(get_prev_episode(fixture_entries, 'ja', 'storyboard', '001')).toBeNull();
  });
});

// --- get_next_episode ---

describe('get_next_episode', () => {
  it('returns episode 002 as next of 001', () => {
    const next = get_next_episode(fixture_entries, 'ja', 'everyday', '001');
    expect(next.data.episode).toBe('002');
  });

  it('returns null for last episode (003)', () => {
    expect(get_next_episode(fixture_entries, 'ja', 'everyday', '003')).toBeNull();
  });

  it('returns null for only episode in lusiphite', () => {
    expect(get_next_episode(fixture_entries, 'ja', 'lusiphite', '001')).toBeNull();
  });
});

// --- build_top_page_data ---

describe('build_top_page_data', () => {
  it('returns array of length top_page_series.length', () => {
    expect(build_top_page_data(fixture_entries)).toHaveLength(top_page_series.length);
  });

  it('first item has shape { series, display_title, href, cover_src }', () => {
    const item = build_top_page_data(fixture_entries)[0];
    expect(item).toHaveProperty('series');
    expect(item).toHaveProperty('display_title');
    expect(item).toHaveProperty('href');
    expect(item).toHaveProperty('cover_src');
  });

  it('everyday item has correct href', () => {
    const item = build_top_page_data(fixture_entries).find(i => i.series === 'everyday');
    expect(item.href).toBe('/ja/comic/everyday/');
  });

  it('everyday item has correct display_title', () => {
    const item = build_top_page_data(fixture_entries).find(i => i.series === 'everyday');
    expect(item.display_title).toBe('Everyday');
  });

  it('everyday item has correct cover_src', () => {
    const item = build_top_page_data(fixture_entries).find(i => i.series === 'everyday');
    expect(item.cover_src).toBe('/images/works/everyday.jpg');
  });

  it('order matches top_page_series constant', () => {
    const result = build_top_page_data(fixture_entries);
    expect(result.map(i => i.series)).toEqual(top_page_series);
  });
});

// --- build_series_paths ---

describe('build_series_paths', () => {
  it('returns array with { params: { lang, series } } shape', () => {
    const result = build_series_paths(fixture_entries);
    expect(result[0]).toHaveProperty('params');
    expect(result[0].params).toHaveProperty('lang');
    expect(result[0].params).toHaveProperty('series');
  });

  it('returns 3 unique paths with fixture data', () => {
    const result = build_series_paths(fixture_entries);
    expect(result).toHaveLength(3);
    const pairs = result.map(r => `${r.params.lang}/${r.params.series}`);
    expect(pairs).toContain('ja/everyday');
    expect(pairs).toContain('ja/storyboard');
    expect(pairs).toContain('ja/lusiphite');
  });

  it('no duplicate lang/series pairs', () => {
    const result = build_series_paths(fixture_entries);
    const pairs = result.map(r => `${r.params.lang}/${r.params.series}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('returns empty array for empty entries', () => {
    expect(build_series_paths([])).toEqual([]);
  });
});

// --- build_episode_paths ---

describe('build_episode_paths', () => {
  it('returns array with { params: { lang, series, episode } } shape', () => {
    const result = build_episode_paths(fixture_entries);
    expect(result[0].params).toHaveProperty('lang');
    expect(result[0].params).toHaveProperty('series');
    expect(result[0].params).toHaveProperty('episode');
  });

  it('result length equals fixture entry count', () => {
    expect(build_episode_paths(fixture_entries)).toHaveLength(fixture_entries.length);
  });

  it('every item has lang=ja and valid series (catches missing parse_entry_id bug)', () => {
    const result = build_episode_paths(fixture_entries);
    const valid_series = ['everyday', 'storyboard', 'lusiphite'];
    for (const item of result) {
      expect(item.params.lang).toBe('ja');
      expect(valid_series).toContain(item.params.series);
    }
  });

  it('episode param equals entry.data.episode (D9 verification)', () => {
    const result = build_episode_paths(fixture_entries);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].params.episode).toBe(fixture_entries[i].data.episode);
    }
  });

  it('returns empty array for empty entries', () => {
    expect(build_episode_paths([])).toEqual([]);
  });
});

// --- build_episode_nav ---
// v0.19.3: 戻り値に prev_episode / next_episode を追加

describe('build_episode_nav', () => {
  it('middle episode 002 returns prev/next/list hrefs + prev/next episode numbers', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '002');
    expect(nav).toEqual({
      prev_href: '/ja/comic/everyday/001/',
      next_href: '/ja/comic/everyday/003/',
      list_href: '/ja/comic/everyday/',
      prev_episode: '001',
      next_episode: '003',
    });
  });

  it('first episode 001 has prev_href null and prev_episode null', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '001');
    expect(nav.prev_href).toBeNull();
    expect(nav.prev_episode).toBeNull();
  });

  it('first episode 001 still has next_href and next_episode set', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '001');
    expect(nav.next_href).toBe('/ja/comic/everyday/002/');
    expect(nav.next_episode).toBe('002');
  });

  it('last episode 003 has next_href null and next_episode null', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '003');
    expect(nav.next_href).toBeNull();
    expect(nav.next_episode).toBeNull();
  });

  it('last episode 003 still has prev_href and prev_episode set', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '003');
    expect(nav.prev_href).toBe('/ja/comic/everyday/002/');
    expect(nav.prev_episode).toBe('002');
  });

  it('list_href always has trailing slash', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '002');
    expect(nav.list_href).toMatch(/\/$/);
  });

  it('prev_href and next_href (when non-null) have trailing slash', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '002');
    expect(nav.prev_href).toMatch(/\/$/);
    expect(nav.next_href).toMatch(/\/$/);
  });

  it('single-episode series (lusiphite/001) has all prev/next null', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'lusiphite', '001');
    expect(nav.prev_href).toBeNull();
    expect(nav.next_href).toBeNull();
    expect(nav.prev_episode).toBeNull();
    expect(nav.next_episode).toBeNull();
  });
});
