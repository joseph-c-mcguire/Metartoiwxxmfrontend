import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      'node_modules/',
      'dist/',
      'tests/',
      '**/*.e2e.spec.ts',
      '**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/ui/**',
        '**/*.spec.ts',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '/utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
