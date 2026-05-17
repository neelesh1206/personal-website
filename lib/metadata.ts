import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neeleshkakaraparthi.dev'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Neelesh Kakaraparthi — Senior Full-Stack Software Engineer',
    template: '%s | Neelesh Kakaraparthi',
  },
  description:
    'Senior Full-Stack Software Engineer with 8+ years at Walmart Global Tech. Built systems that scaled Walmart homepages 150x. Next.js, TypeScript, Java, distributed systems.',
  authors: [{ name: 'Neelesh Kakaraparthi', url: siteUrl }],
  creator: 'Neelesh Kakaraparthi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Neelesh Kakaraparthi',
    title: 'Neelesh Kakaraparthi — Senior Full-Stack Software Engineer',
    description:
      'Senior Full-Stack Software Engineer with 8+ years at Walmart Global Tech. Built systems that scaled Walmart homepages 150x.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neelesh Kakaraparthi — Senior Full-Stack Software Engineer',
    description: 'Senior Full-Stack Software Engineer with 8+ years at Walmart Global Tech.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export function createMetadata(overrides: Partial<Metadata>): Metadata {
  return { ...defaultMetadata, ...overrides }
}
