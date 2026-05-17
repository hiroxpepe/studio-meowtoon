// Utility functions for comic content access and page data building.
// All functions accept a pre-fetched entries array (D1 — pure, testable, no Astro runtime).

import { series_titles, series_covers, top_page_series } from './series_meta.js';

/**
 * Parses a collection entry id into its lang/series/episode_id components.
 * @param {string} entry_id - e.g. 'ja/everyday/001'
 * @returns {{ lang: string, series: string, episode_id: string }}
 */
export function parse_entry_id(entry_id) {
  const [lang, series, episode_id] = entry_id.split('/');
  return { lang, series, episode_id };
}

/**
 * Returns a sorted list of unique series slugs for a given language.
 * @param {Object[]} entries - Astro collection entries
 * @param {string} lang
 * @returns {string[]}
 */
export function get_series_list(entries, lang) {
  const slugs = entries
    .map(e => parse_entry_id(e.id))
    .filter(p => p.lang === lang)
    .map(p => p.series);
  return [...new Set(slugs)].sort();
}

/**
 * Returns all episodes for a lang/series combination, sorted ascending by episode field.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @returns {Object[]}
 */
export function get_all_episodes(entries, lang, series) {
  return entries
    .filter(e => {
      const p = parse_entry_id(e.id);
      return p.lang === lang && p.series === series;
    })
    .sort((a, b) => a.data.episode < b.data.episode ? -1 : a.data.episode > b.data.episode ? 1 : 0);
}

/**
 * Returns the single entry matching lang/series/episode_id, or undefined if not found.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {Object|undefined}
 */
export function get_episode(entries, lang, series, episode_id) {
  return entries.find(e => e.id === `${lang}/${series}/${episode_id}`);
}

/**
 * Returns the previous episode in the series, or null if current is first.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {Object|null}
 */
export function get_prev_episode(entries, lang, series, episode_id) {
  const eps = get_all_episodes(entries, lang, series);
  const idx = eps.findIndex(e => e.data.episode === episode_id);
  return idx > 0 ? eps[idx - 1] : null;
}

/**
 * Returns the next episode in the series, or null if current is last.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {Object|null}
 */
export function get_next_episode(entries, lang, series, episode_id) {
  const eps = get_all_episodes(entries, lang, series);
  const idx = eps.findIndex(e => e.data.episode === episode_id);
  return idx >= 0 && idx < eps.length - 1 ? eps[idx + 1] : null;
}

/**
 * Builds the data array for the top page — one item per series in top_page_series order.
 * @param {Object[]} entries
 * @returns {{ series: string, display_title: string, href: string, cover_src: string }[]}
 */
export function build_top_page_data(entries) {
  return top_page_series.map(slug => ({
    series:        slug,
    display_title: series_titles[slug],
    href:          `/ja/comic/${slug}/`,
    cover_src:     series_covers[slug],
  }));
}

/**
 * Builds getStaticPaths output for the series list page.
 * @param {Object[]} entries
 * @returns {{ params: { lang: string, series: string } }[]}
 */
export function build_series_paths(entries) {
  const seen = new Set();
  const result = [];
  for (const e of entries) {
    const { lang, series } = parse_entry_id(e.id);
    const key = `${lang}/${series}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ params: { lang, series } });
    }
  }
  return result;
}

/**
 * Builds getStaticPaths output for the episode page.
 * ⚠️ Must call parse_entry_id(entry.id) to extract lang/series — they are NOT in outer scope.
 * @param {Object[]} entries
 * @returns {{ params: { lang: string, series: string, episode: string } }[]}
 */
export function build_episode_paths(entries) {
  return entries.map(entry => {
    const { lang, series } = parse_entry_id(entry.id);
    return { params: { lang, series, episode: entry.data.episode } };
  });
}

/**
 * Builds prev/next/list hrefs for episode navigation.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {{ prev_href: string|null, next_href: string|null, list_href: string }}
 */
export function build_episode_nav(entries, lang, series, episode_id) {
  const prev = get_prev_episode(entries, lang, series, episode_id);
  const next = get_next_episode(entries, lang, series, episode_id);
  const list_href  = `/${lang}/comic/${series}/`;
  const prev_href  = prev ? `/${lang}/comic/${series}/${prev.data.episode}/` : null;
  const next_href  = next ? `/${lang}/comic/${series}/${next.data.episode}/` : null;
  return { prev_href, next_href, list_href };
}
