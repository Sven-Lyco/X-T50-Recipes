/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/images': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test-utils.tsx',
        // PDF renderer runs in a non-HTML context — not testable with jsdom
        'src/components/RecipePdf.tsx',
        'src/components/RecipeCardPdf.tsx',
        // Canvas + Web Share API — not available in jsdom
        'src/utils/recipeImageExport.ts',
        // Pure React-Query / axios infrastructure, no business logic
        'src/api/recipes.ts',
        'src/api/client.ts',
      ],
    },
  },
})