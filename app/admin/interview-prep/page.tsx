import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { listInterviewQuestions } from '@/lib/admin/prep/interview-queries'
import { getSettings } from '@/lib/admin/prep/queries'
import { InterviewPrepClient } from '@/components/admin/interview-prep/InterviewPrepClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Interview prep — Admin',
  description: 'Recruiter screen reference. Private.',
  robots: { index: false, follow: false },
}

export default async function InterviewPrepPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')

  const [questions, settings] = await Promise.all([listInterviewQuestions(), getSettings()])

  return (
    <InterviewPrepClient
      initialQuestions={questions}
      initialDeliveryRules={settings.interview_delivery_rules ?? []}
    />
  )
}
