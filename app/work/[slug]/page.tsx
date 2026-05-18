import { notFound } from 'next/navigation'
import { CaseStudyContent } from '@/components/work/CaseStudyContent'
import { caseStudies, getAdjacentCaseStudies, getCaseStudy } from '@/lib/case-studies/data'
import { createMetadata } from '@/lib/metadata'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  return caseStudies.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const cs = getCaseStudy(slug)
  if (!cs) return createMetadata({ title: 'Case Study Not Found' })
  return createMetadata({
    title: cs.title,
    description: cs.summary,
  })
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const cs = getCaseStudy(slug)
  if (!cs) notFound()
  const { prev, next } = getAdjacentCaseStudies(slug)
  return <CaseStudyContent caseStudy={cs} prev={prev} next={next} />
}
