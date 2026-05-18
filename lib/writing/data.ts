export type Publication = {
  slug: string
  title: string
  abstract: string
  journal: string
  publishedOn: string
  url: string
  doi?: string
  tags: string[]
  external: true
}

export const publications: Publication[] = [
  {
    slug: 'scaling-personalization-with-generative-ai',
    title: 'Scaling Personalization with Generative AI',
    abstract:
      'GenAI transforms customer personalization by moving beyond static rule-based systems to create dynamic, individualized experiences through continuous learning. The technology unifies disparate data sources, generates personalized content while maintaining brand consistency, and provides predictive capabilities that anticipate customer needs.',
    journal: 'Journal of Computer Science and Technology Studies',
    publishedOn: '2025-07-08',
    url: 'https://al-kindipublisher.com/index.php/jcsts/article/view/10276',
    doi: '10.32996/jcsts.2025.7.7.45',
    tags: ['Generative AI', 'Personalization', 'Customer Experience'],
    external: true,
  },
  {
    slug: 'generative-ai-in-content-creation-and-cms-integration',
    title:
      'Generative AI in Content Creation and CMS Integration: Transforming Digital Content Management Through Intelligent Automation',
    abstract:
      'Examines how generative AI integrates into content management systems through layered architectures (data services, orchestration, user-facing applications), enabling scalable content production while preserving editorial quality and brand consistency. Covers the co-pilot paradigm — AI handles automated blog generation, product descriptions, and personalized social content while humans retain strategic oversight.',
    journal: 'Sarcouncil Journal of Multidisciplinary',
    publishedOn: '2025-07-11',
    url: 'https://www.sarcouncil.com/download-article/SJMD-111-2025-303-309.pdf',
    tags: ['Generative AI', 'CMS', 'Content Management', 'Architecture'],
    external: true,
  },
  {
    slug: 'explicit-orchestration-in-ai-ml-workloads',
    title: 'Explicit Orchestration in AI/ML Workloads: A Technical Analysis',
    abstract:
      'Examines how explicit orchestration manages complex machine learning workloads in distributed systems — MLOps frameworks, automation tools, and ethical AI compliance requirements within enterprise ML architectures.',
    journal: 'International Journal of Computing and Engineering',
    publishedOn: '2025',
    url: 'https://ideas.repec.org/a/bhx/ojijce/v7y2025i11p53-63id2972.html',
    tags: ['MLOps', 'Distributed Systems', 'AI/ML', 'Orchestration'],
    external: true,
  },
]

export function formatPublishedOn(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}
