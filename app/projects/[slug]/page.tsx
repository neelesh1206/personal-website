import { notFound } from 'next/navigation'
import { ProjectContent } from '@/components/projects/ProjectContent'
import { getProject, projects } from '@/lib/projects/data'
import { createMetadata } from '@/lib/metadata'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) return createMetadata({ title: 'Project Not Found' })
  return createMetadata({ title: p.title, description: p.summary.slice(0, 200) })
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) notFound()
  return <ProjectContent project={p} />
}
