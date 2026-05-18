import type { NextConfig } from 'next'

import path from 'path'

const uiSrc = path.resolve(__dirname, '../../packages/ui/src')

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui'],
  turbopack: {
    resolveAlias: {
      '@ui/components': path.join(uiSrc, 'components'),
      '@ui/lib': path.join(uiSrc, 'lib'),
      '@ui/hooks': path.join(uiSrc, 'hooks')
    }
  }
}

export default nextConfig
