import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Rewrites barrel-file imports like `import { ArrowRight } from 'lucide-react'`
  // into per-icon paths at compile time, so we only ship the icons we actually
  // use. Without this Next sometimes pulls the whole icon set into the shared
  // chunk because of the package's barrel export shape. PageSpeed Insights
  // flagged ~27 KiB of unused JS in the framework chunk; lucide-react was the
  // culprit.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
