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
    react: true
  },
  tailwind: {
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
  }
},
{
  rules: {
    '@eslint-react/no-nested-component-definitions': 'off'
  }
})
