// works utility functions.

/**
 * Returns all works entries for a given category, sorted by published_at descending.
 * @param {Object[]} entries
 * @param {string} category
 * @returns {Object[]}
 */
export function get_works_by_category(entries, category) {
  return entries
    .filter(e => e.data.category === category)
    .sort((a, b) => {
      const da = a.data.published_at ?? '';
      const db = b.data.published_at ?? '';
      return db.localeCompare(da);
    });
}

/**
 * Returns true if any works entry exists for the given category.
 * @param {Object[]} entries
 * @param {string} category
 * @returns {boolean}
 */
export function has_works(entries, category) {
  return entries.some(e => e.data.category === category);
}

/**
 * Returns the most recently published work for a given category, or undefined if none.
 * @param {Object[]} entries
 * @param {string} category
 * @returns {Object|undefined}
 */
export function get_latest_work(entries, category) {
  const list = get_works_by_category(entries, category);
  return list.length > 0 ? list[0] : undefined;
}
