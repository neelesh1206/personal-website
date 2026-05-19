import type { MetadataRoute } from 'next'
import { caseStudies } from '@/lib/case-studies/data'
import { projects } from '@/lib/projects/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neeleshkakaraparthi.dev'
  const now = new Date()

  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'monthly' as const },
    { path: '/work', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/writing', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/projects', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/life', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/now', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/connect', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/resume', priority: 0.5, changeFrequency: 'monthly' as const },
  ].map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const caseStudyRoutes = caseStudies.map((c) => ({
    url: `${base}/work/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const projectRoutes = projects.map((p) => ({
    url: `${base}/projects/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...caseStudyRoutes, ...projectRoutes]
}
