// Probity: blocks writes that skip test-driven development (installed by /ewa:quality-gates).
// Docs: https://github.com/nizos/probity/blob/main/docs/configuration.md
import { defineConfig, enforceTdd } from '@nizos/probity'

export default defineConfig({
  rules: [
    {
      // Source and test code only. Docs, agent files and configuration stay free.
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.java', '**/*.kt', '**/*.rb', '**/*.php'],
      rules: [enforceTdd()],
    },
  ],
})
