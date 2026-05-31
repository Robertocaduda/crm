import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DealForm from '@/components/pipeline/deal-form'
import type { Deal } from '@crm/shared'

export default async function EditarDealPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect('/login')

  const res = await fetch(`${process.env.API_URL}/api/pipeline/deals/${params.id}`, {
    headers: { Cookie: `access_token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/pipeline')

  const { data }: { data: Deal } = await res.json()
  return <DealForm initial={data} />
}
