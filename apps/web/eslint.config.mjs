import { eslintConfig } from '@santi020k/eslint-config-basic'
import next from '@santi020k/eslint-config-next'
import react from '@santi020k/eslint-config-react'

export default [
  ...eslintConfig({
    typescript: true,
    frameworks: {
      react,
      next
    }
  }),
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app/globals.css'
      }
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': ['error', {
        entryPoint: 'src/app/globals.css',
        ignore: [
          '^dark$',
          '^animate-(slide-up-fade|fade-in|scale-in|answer-reveal|hero-word)$',
          '^delay-(0|75|150|225|300|375)$',
          '^blob-[1-3]$',
          '^shimmer$',
          '^card-hover$',
          '^input-focus$',
          '^prose-streaming$'
        ]
      }]
    }
  }
]
