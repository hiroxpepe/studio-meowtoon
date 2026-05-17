// Vitest configuration: runs tests in Node environment for pure JS utility testing.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    include: [
      'src/**/*.test.js',
      'scripts/**/*.test.mjs',
    ],
  },
});
