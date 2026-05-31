import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ContactForm from '@/components/contacts/contact-form'
import type { Contact } from '@crm/shared'

export default async function EditarContatoPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect('/login')

  const res = await fetch(`${process.env.API_URL}/api/contacts/${params.id}`, {
    headers: { Cookie: `access_token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/contatos')

  const { data }: { data: Contact } = await res.json()
  return <ContactForm initial={data} />
}
