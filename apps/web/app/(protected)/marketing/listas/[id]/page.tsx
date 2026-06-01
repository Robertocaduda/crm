import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ListDetail from '@/components/marketing/list-detail'
import type { MarketingList, MarketingListMember } from '@crm/shared'

export default async function ListDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect('/login')
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const headers = { Cookie: `access_token=${token}` }

  const [listRes, membersRes] = await Promise.all([
    fetch(`${apiUrl}/api/marketing/lists/${params.id}`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/marketing/lists/${params.id}/members?page=1&limit=20`, { headers, cache: 'no-store' }),
  ])

  if (!listRes.ok) redirect('/marketing')

  const { data: list }: { data: MarketingList } = await listRes.json()
  const membersData = membersRes.ok ? await membersRes.json() : { data: [], meta: { total: 0, page: 1 } }

  return (
    <ListDetail
      list={list}
      initialMembers={membersData.data as MarketingListMember[]}
      initialTotal={membersData.meta.total}
      initialPage={membersData.meta.page}
    />
  )
}
