import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  detectRootDir: import.meta.dirname,
  features: {
    'jest-dom': false,
    perfectionist: false,
    zod: false
  },
  typescript: true,
  frameworks: {
    next: true
  },
  tailwind: {
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
  }
})
