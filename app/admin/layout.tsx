import { AdminNav } from '@/components/admin/AdminNav'
import { isAdminAuthenticated } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate everything under /admin except /admin/login (which doesn't render this layout
  // because it lives in app/admin/login/ as a sibling and Next picks the closest layout).
  // The login page also runs the same auth check and just redirects elsewhere if you are
  // already signed in.
  const authed = await isAdminAuthenticated()
  return (
    <>
      {authed ? <AdminNav /> : null}
      {children}
    </>
  )
}
