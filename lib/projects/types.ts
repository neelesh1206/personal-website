export type ProjectStatus = 'Live' | 'Building' | 'Planned' | 'Sunset'

export type ProjectMetric = {
  value: string
  label: string
  context?: string
}

export type ProjectSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type ProjectLink = {
  label: string
  href: string
  primary?: boolean
}

export type Project = {
  slug: string
  title: string
  tagline: string
  tag: string // Open Source · AI Tool · Product · etc.
  status: ProjectStatus
  period: string
  liveUrl?: string
  summary: string
  metrics?: ProjectMetric[]
  stack: string[]
  problem?: string
  sections?: ProjectSection[]
  shipped?: string[]
  links?: ProjectLink[]
}
