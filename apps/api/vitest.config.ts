import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Only run files in src/__tests__/
    include: ['src/__tests__/**/*.test.ts'],
    // Exclude node_modules and generated files
    exclude: ['node_modules/**', 'dist/**'],
    // Sequential execution for integration tests that share DB state
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/prisma/**', 'src/**/*.test.ts', 'src/**/__tests__/**'],
    },
  },
});
