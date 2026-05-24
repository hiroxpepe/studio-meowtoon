// Site configuration: public, non-secret values that identify this site.
// Edit these values to make this site your own. For sensitive or environment-
// specific values (production URL, analytics ID), see .env.example.

export const site = {
  // Site identity. `name` is used in <title> and og:site_name.
  name: 'STUDIO MeowToon',

  // Creator profile (shown on the About page).
  creator: {
    name: 'STUDIO MeowToon',
    role: '4-panel comic creator',
    avatar_text: 'MT',
    bio_line_1: 'One creator. One comic. Every day.',
    bio_line_2: 'Drawing about the small surprises of daily life.',
  },

  // Social handles. Set any value to an empty string to hide that row.
  // URLs are constructed at render time from the handle.
  social: {
    x: 'studio_meowtoon',
    instagram: 'studio.meowtoon',
    github: 'hiroxpepe',
  },

  // Contact email shown on the About page. Leave as empty string to hide.
  email: 'hello@meowtoon.com',
  email_label: 'For business inquiries',
};
