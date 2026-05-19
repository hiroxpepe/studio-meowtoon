// today_discovery utility functions.

/**
 * Returns the most recent today_discovery entry by date, or undefined if none.
 * @param {Object[]} entries
 * @returns {Object|undefined}
 */
export function get_latest_discovery(entries) {
  if (entries.length === 0) return undefined;
  return [...entries].sort((a, b) => b.data.date.localeCompare(a.data.date))[0];
}

/**
 * Returns up to n today_discovery entries sorted by date descending (newest first).
 * @param {Object[]} entries
 * @param {number} n
 * @returns {Object[]}
 */
export function get_recent_discoveries(entries, n) {
  return [...entries]
    .sort((a, b) => b.data.date.localeCompare(a.data.date))
    .slice(0, n);
}
