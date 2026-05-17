// Synthetic fixture entries matching Astro v5 getCollection() return shape.
// Used by all unit tests in comic.test.js — no Astro runtime required.

/**
 * @typedef {Object} FixtureEntry
 * @property {string} id
 * @property {string} collection
 * @property {{ title: string, episode: string, description: string, images: string[] }} data
 * @property {string} body
 */

/** @type {FixtureEntry[]} */
export const fixture_entries = [
  {
    id:         'ja/everyday/001',
    collection: 'comic',
    data: {
      title:       'fixture title 001',
      episode:     '001',
      description: '',
      images:      ['/images/comic/ja/everyday/001/cut-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/everyday/002',
    collection: 'comic',
    data: {
      title:       'fixture title 002',
      episode:     '002',
      description: 'middle episode desc',
      images:      ['/images/comic/ja/everyday/002/cut-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/everyday/003',
    collection: 'comic',
    data: {
      title:       'fixture title 003',
      episode:     '003',
      description: 'last everyday desc',
      images:      ['/images/comic/ja/everyday/003/cut-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/storyboard/001',
    collection: 'comic',
    data: {
      title:       'storyboard title 001',
      episode:     '001',
      description: 'storyboard desc',
      images:      ['/images/comic/ja/storyboard/001/name-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/storyboard/002',
    collection: 'comic',
    data: {
      title:       'storyboard title 002',
      episode:     '002',
      description: 'storyboard desc 002',
      images:      ['/images/comic/ja/storyboard/002/name-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/lusiphite/001',
    collection: 'comic',
    data: {
      title:       'lusiphite title 001',
      episode:     '001',
      description: 'lusiphite desc',
      images:      ['/images/comic/ja/lusiphite/001/cut-1.jpg'],
    },
    body: '',
  },
];
