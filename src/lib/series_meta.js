// Single source of truth for series display names, order, and cover image paths.

/**
 * Maps series slug to display title.
 * @type {Record<string, string>}
 */
export const series_titles = {
  everyday:   'Everyday',
  storyboard: 'Storyboard',
  lusiphite:  'Lusiphite',
};

/**
 * Maps series slug to public cover image path.
 * @type {Record<string, string>}
 */
export const series_covers = {
  everyday:   '/images/works/everyday.jpg',
  storyboard: '/images/works/storyboard.jpg',
  lusiphite:  '/images/works/lusiphite.jpg',
};

/**
 * Series shown on the top page, in display order.
 * @type {string[]}
 */
export const top_page_series = ['everyday', 'storyboard', 'lusiphite'];

/**
 * One-line descriptions for each series (used on the home page sections).
 * @type {Record<string, string>}
 */
export const series_descriptions = {
  everyday:   'A slice-of-life daily manga. New episodes every day.',
  storyboard: 'A story-driven series exploring narrative and imagination.',
  lusiphite:  'A fantasy adventure set in a world between light and shadow.',
};
