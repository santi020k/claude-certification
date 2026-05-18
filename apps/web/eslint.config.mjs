import { eslintConfig } from '@santi020k/eslint-config-basic'
import next from '@santi020k/eslint-config-next'
import react from '@santi020k/eslint-config-react'

export default eslintConfig({
  typescript: true,
  frameworks: {
    react,
    next,
  },
})
