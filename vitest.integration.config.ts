import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts', './src/__tests__/utils/firebase-test-utils.ts'],
    globals: true,
    testTimeout: 30000, // Longer timeout for integration tests
    include: ['src/__tests__/integration/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})