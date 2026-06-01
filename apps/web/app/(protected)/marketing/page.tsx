import { cookies } from 'next/headers'
import ListGrid from '@/components/marketing/list-grid'
import type { MarketingList } from '@crm/shared'

export default async function MarketingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value ?? ''
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

  let lists: MarketingList[] = []
  try {
    const res = await fetch(`${apiUrl}/api/marketing/lists`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      lists = data.data
    }
  } catch {}

  return <ListGrid lists={lists} />
}
