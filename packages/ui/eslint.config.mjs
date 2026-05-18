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
          '^(.*:)?animate-caret-blink$',
          '^(.*:)?fade-(in|out)-0$',
          '^(.*:)?fade-(in|out)$',
          '^(.*:)?zoom-(in|out)-(90|95)$',
          '^(.*:)?slide-(in|out)-from-(top|bottom|left|right)(-2|-52)?$',
          '^(.*:)?slide-(in|out)-to-(top|bottom|left|right)(-52)?$',
          '^origin-top-center$',
          '^toaster$'
        ]
      }]
    }
  }
]
