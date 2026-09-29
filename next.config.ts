import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  poweredByHeader: false,
  images: { remotePatterns: [] },
  // No landing page: the public timeline is the front door.
  redirects: async () => [{ source: '/', destination: '/home', permanent: false }],
}

export default nextConfig
