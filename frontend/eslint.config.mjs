import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  {
    // The application uses client-side storage/bootstrap and imperative loaders.
    // Keep cascading-render guidance visible during migration; hooks correctness,
    // purity, static-component and JSX rules remain errors.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**']),
])
