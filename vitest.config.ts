import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Components are exercised by Playwright (tests/e2e). Unit coverage
      // tracks lib/ — the pure-logic modules.
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/*.test.ts',
        // Server-only modules that require a live DB or external service —
        // exercised via integration / e2e tests, not unit coverage.
        'lib/db/**',
        'lib/email/resend.ts',
        'lib/strava/client.ts',
        'lib/analytics/queries.ts',
        // Pure data / constants, no logic to test.
        'lib/case-studies/data.ts',
        'lib/writing/data.ts',
        'lib/metadata.ts',
        '**/types.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `server-only` is a Next.js convention that throws at runtime when
      // imported from a client component. In vitest we run modules in
      // Node directly, so stub it to an empty module to avoid resolution errors.
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
})
