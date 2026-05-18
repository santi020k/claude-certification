import { eslintConfig } from '@santi020k/eslint-config-basic'
import react from '@santi020k/eslint-config-react'

export default [
  ...eslintConfig({
  typescript: true,
  frameworks: {
    react
  }
  }),
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/globals.css'
      }
    }
  }
]
