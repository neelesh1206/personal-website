const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neeleshkakaraparthi.dev'

const PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Neelesh Kakaraparthi',
  alternateName: ['Neelesh Kumar Kakaraparthi'],
  url: SITE_URL,
  image: `${SITE_URL}/apple-icon`,
  jobTitle: 'Senior Full-Stack Software Engineer',
  worksFor: {
    '@type': 'Organization',
    name: 'Walmart Global Tech',
    url: 'https://walmart.com',
  },
  alumniOf: [
    {
      '@type': 'CollegeOrUniversity',
      name: 'Southern Arkansas University',
    },
    {
      '@type': 'CollegeOrUniversity',
      name: 'Kakatiya University',
    },
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Redmond',
    addressRegion: 'WA',
    addressCountry: 'US',
  },
  knowsAbout: [
    'Full-Stack Engineering',
    'Distributed Systems',
    'Next.js',
    'React',
    'TypeScript',
    'Java',
    'Spring Boot',
    'PostgreSQL',
    'Kafka',
    'Generative AI',
    'MLOps',
    'Content Management Systems',
  ],
  sameAs: [
    'https://www.linkedin.com/in/neelesh-kakaraparthi-161b8554/',
    'https://github.com/neelesh1206',
    'https://www.strava.com/athletes/152539784',
    'https://marketmind.neeleshkakaraparthi.dev',
    'https://al-kindipublisher.com/index.php/jcsts/article/view/10276',
    'https://www.sarcouncil.com/download-article/SJMD-111-2025-303-309.pdf',
    'https://ideas.repec.org/a/bhx/ojijce/v7y2025i11p53-63id2972.html',
    'https://doi.org/10.32996/jcsts.2025.7.7.45',
  ],
}

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Neelesh Kakaraparthi',
  url: SITE_URL,
  inLanguage: 'en-US',
  author: { '@type': 'Person', name: 'Neelesh Kakaraparthi', url: SITE_URL },
}

export function HomePageJsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        // schema.org JSON-LD: must be inline JSON; safe — no untrusted input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
      />
    </>
  )
}
