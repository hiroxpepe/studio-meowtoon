// Fixture entries for works collection tests.
// Note: NO 'project' category entry — intentional, to test has_works(entries, 'project') === false.
export const fixture_works = [
  {
    id: 'games/meow-adventure',
    collection: 'works',
    data: { title: 'Meow Adventure', category: 'game', description: 'A side-scroller.', tags: ['action'], published_at: '2026-03-01' },
    body: '',
  },
  {
    id: 'games/cat-quiz',
    collection: 'works',
    data: { title: 'Cat Quiz', category: 'game', description: '', tags: [], published_at: '2026-01-15' },
    body: '',
  },
  {
    id: 'assets/cat-pack-vol1',
    collection: 'works',
    data: { title: 'Cat 3D Pack Vol.1', category: 'asset', description: '', tags: ['3d'], published_at: '2026-02-10' },
    body: '',
  },
  {
    id: 'books/dev-diary-vol1',
    collection: 'works',
    data: { title: 'Dev Diary Vol.1', category: 'book', description: '', tags: [], published_at: '2025-12-01' },
    body: '',
  },
];
