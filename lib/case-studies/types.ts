export type Metric = {
  value: string
  label: string
  context?: string
}

export type Section = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type PlatformId = 'prism' | 'tempo'

export type CaseStudy = {
  slug: string
  platform: PlatformId
  platformLabel: string
  title: string
  tagline: string
  role: string
  period: string
  status: 'In production' | 'Active rollout' | 'Sunset'
  customerFacing: boolean
  summary: string
  metrics: Metric[]
  stack: string[]
  problem: string
  sections: Section[]
  shipped: string[]
  links?: { label: string; href: string }[]
  accent: {
    gradient: string
    border: string
    text: string
  }
}
