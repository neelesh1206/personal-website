export type PlanTask = { id: string; label: string }

export type PlanDayCoding = {
  pattern: string
  guidance?: string
  tasks: PlanTask[]
}

export type PlanDaySystem = {
  topic: string
  concepts: string
  anchor: string
  tasks: PlanTask[]
}

export type PlanDay = {
  day: number
  title: string
  coding: PlanDayCoding
  systemDesign: PlanDaySystem
  wrapup: PlanTask[]
}

export type PlanRule = { id: string; title: string; body: string }
export type PlanStructure = { block: string; body: string }
export type PlanPattern = { name: string; when: string }
export type PlanFrameworkStep = { step: number; title: string; body: string }

export type Plan = {
  meta: {
    title: string
    subtitle: string
    timePerDay: string
    split: string
    language: string
  }
  rules: PlanRule[]
  dailyStructure: PlanStructure[]
  days: PlanDay[]
  patterns: PlanPattern[]
  framework: {
    title: string
    tagline: string
    steps: PlanFrameworkStep[]
    advantage: string
  }
}

export type LibraryItem = {
  id: string
  question: string
  answer: string
  projectUsage: string
  remember?: string
}

export type LibraryTopic = {
  id: string
  name: string
  anchor: string
  items: LibraryItem[]
}

export type Library = {
  meta: { title: string; subtitle: string }
  deliveryRules: string[]
  rapidFire: {
    versions: { tool: string; version: string; where: string }[]
    numbers: { label: string; value: string }[]
  }
  topics: LibraryTopic[]
}
