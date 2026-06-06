export type Badge = {
  id: string
  name: string
  tagline: string
  description: string
  tier?: 'bronze' | 'silver' | 'gold' | 'iron'
}

export const BADGES: Badge[] = [
  {
    id: 'first-blood',
    name: 'First Blood',
    tagline: 'Solved your first problem.',
    description: 'You started. The reps are the only thing that matter from here.',
    tier: 'bronze',
  },
  {
    id: 'streak-x3',
    name: 'Streak ×3',
    tagline: '3 consecutive study days.',
    description: 'You’ve shown up three days in a row. The chain is alive.',
    tier: 'bronze',
  },
  {
    id: 'streak-x7',
    name: 'Streak ×7',
    tagline: '7 consecutive study days.',
    description: 'A full week. This is when most people quit.',
    tier: 'silver',
  },
  {
    id: 'streak-x14',
    name: 'Streak ×14',
    tagline: '14 consecutive study days.',
    description: 'Two weeks. The habit is set.',
    tier: 'gold',
  },
  {
    id: 'iron-discipline',
    name: 'Iron Discipline',
    tagline: 'Study + CrossFit, same day, 5×.',
    description: 'Brain and body on the same day, five times. You’re running the program.',
    tier: 'iron',
  },
  {
    id: 'cold-turkey',
    name: 'Cold Turkey',
    tagline: 'A full day, zero deviation.',
    description: 'You showed up, finished the routine, and ticked "no deviation". Rare.',
    tier: 'silver',
  },
  {
    id: 'application-machine-10',
    name: 'Application Machine ×10',
    tagline: '10 applications sent.',
    description: 'The funnel is open.',
    tier: 'bronze',
  },
  {
    id: 'application-machine-25',
    name: 'Application Machine ×25',
    tagline: '25 applications sent.',
    description: 'The wider you cast, the more replies come back.',
    tier: 'silver',
  },
  {
    id: 'application-machine-50',
    name: 'Application Machine ×50',
    tagline: '50 applications sent.',
    description: 'Half a hundred. Each one is a reroll.',
    tier: 'gold',
  },
  {
    id: 'pattern-master',
    name: 'Pattern Master',
    tagline: 'Finished all coding tasks for a plan day, 5×.',
    description: 'You closed 5 full coding-day boxes. Pattern recall is back.',
    tier: 'gold',
  },
  {
    id: 'the-resolver',
    name: 'The Re-Solver',
    tagline: '10 problems re-solved from blank.',
    description:
      'You went back to the failures and beat them. This is the rep that actually builds recall.',
    tier: 'gold',
  },
  {
    id: 'showed-up',
    name: 'Showed Up',
    tagline: 'Morning anchor read 7 days running.',
    description: 'You started the day with the evidence line, seven days in a row.',
    tier: 'silver',
  },
  {
    id: 'finisher',
    name: 'Finisher',
    tagline: 'Completed all 10 plan days.',
    description: 'The full program. Hard part now: keep the structure going.',
    tier: 'gold',
  },
]

export const BADGE_INDEX: Record<string, Badge> = Object.fromEntries(BADGES.map((b) => [b.id, b]))
