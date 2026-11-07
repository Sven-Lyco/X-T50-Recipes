// Probity: blocks writes that skip test-driven development (installed by /ewa:quality-gates).
// Docs: https://github.com/nizos/probity/blob/main/docs/configuration.md
import { defineConfig, enforceTdd } from '@nizos/probity'

const HISTORY_NOTE = `
Writes that this guard blocked earlier in the session did not happen: they are not in the files.
Judge only by the current file content and by test runs that actually happened.`

export default defineConfig({
  rules: [
    {
      // Source and test code only. Docs, agent files and configuration stay free.
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.java', '**/*.kt', '**/*.rb', '**/*.php'],
      rules: [enforceTdd({ instructions: (defaults) => defaults + HISTORY_NOTE })],
    },
  ],
})
