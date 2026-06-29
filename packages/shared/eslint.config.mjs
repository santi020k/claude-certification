import { defineConfig, Runtime } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  detectRootDir: import.meta.dirname,
  ignores: ['dist/**', 'node_modules/**', 'openapi.json', 'src/openapi.d.ts'],
  features: {
    perfectionist: false,
    zod: false
  },
  runtime: Runtime.Universal,
  tsconfigRootDir: import.meta.dirname,
  typescript: true
})
