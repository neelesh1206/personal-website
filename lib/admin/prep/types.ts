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

export type RoutineBlockKind =
  | 'single'
  | 'checklist'
  | 'pomodoro'
  | 'plan-anchor'
  | 'english'
  | 'reward'

export type RoutineTask = { id: string; label: string; count?: number }

export type RoutineBlock = {
  id: string
  title: string
  duration: string
  icon: string
  kind: RoutineBlockKind
  body?: string
  rule?: string
  tasks?: RoutineTask[]
}

export type JournalPrompt = {
  id: string
  label: string
  field: 'journalFinished' | 'journalAvoided' | 'journalWin' | 'journalDeviation'
}

export type Routine = {
  meta: { title: string; tagline: string }
  blocks: RoutineBlock[]
  journalPrompts: JournalPrompt[]
  freePracticeDay: { title: string; coding: string; systemDesign: string; rule: string }
}

export type DailyLog = {
  logDate: string
  morningAnchorRead: boolean
  trainedToday: boolean
  readAloud: boolean
  rewardEarned: boolean
  rewardStartedAt: string | null
  applicationsCount: number
  problemsSolved: number
  mood: number | null
  journalFinished: string
  journalAvoided: string
  journalWin: string
  journalDeviation: string
  noDeviation: boolean
}

export type BadgeRecord = {
  badgeId: string
  unlockedAt: string
}

export type SettingsMap = {
  plan_start_date?: string
  email_time?: string
  evidence_line?: string
  reward_minutes?: number
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
