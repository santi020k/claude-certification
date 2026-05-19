import path from 'path'

const wsEslint = (workspace) => (files) => {
  const wsDir = path.resolve(workspace)
  const relFiles = files.map((f) => path.relative(wsDir, f)).join(' ')
  return `cd ${workspace} && pnpm exec eslint --fix ${relFiles}`
}

export default {
  // Per-workspace ESLint (each has its own flat config)
  'apps/web/**/*.{ts,tsx,js,jsx,mjs}': wsEslint('apps/web'),
  'packages/ui/**/*.{ts,tsx,js,jsx,mjs}': wsEslint('packages/ui'),

  // Python: fix and format staged files only
  'apps/api/**/*.py': (files) => {
    const apiDir = path.resolve('apps/api')
    const relFiles = files.map((f) => path.relative(apiDir, f)).join(' ')
    return [
      `cd apps/api && .venv/bin/ruff check --fix ${relFiles}`,
      `cd apps/api && .venv/bin/ruff format ${relFiles}`,
    ]
  },
}
