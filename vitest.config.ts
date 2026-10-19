import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // tsconfig keeps JSX for Next (`jsx: preserve`); tests that import a route
  // module (`*.tsx`) for its metadata need it compiled.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
