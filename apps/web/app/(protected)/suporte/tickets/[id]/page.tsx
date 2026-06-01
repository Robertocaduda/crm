import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TicketDetail from '@/components/support/ticket-detail'
import type { Ticket } from '@crm/shared'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect('/login')

  const res = await fetch(`${process.env.API_URL}/api/tickets/${params.id}`, {
    headers: { Cookie: `access_token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/suporte')

  const { data }: { data: Ticket } = await res.json()
  return <TicketDetail initial={data} />
}
