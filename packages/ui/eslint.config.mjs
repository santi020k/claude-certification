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
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': ['error', {
        entryPoint: 'src/globals.css',
        ignore: [
          '^(.*:)?animate-(accordion-down|accordion-up|in|out)$',
          '^(.*:)?fade-(in|out)-0$',
          '^(.*:)?zoom-(in|out)-95$',
          '^(.*:)?slide-(in|out)-from-(top|bottom|left|right)-2$'
        ]
      }]
    }
  }
]
