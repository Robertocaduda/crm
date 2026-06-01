import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ContactListsSection from '@/components/marketing/contact-lists-section'
import type { Contact } from '@crm/shared'

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) redirect('/login')
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

  const res = await fetch(`${apiUrl}/api/contacts/${params.id}`, {
    headers: { Cookie: `access_token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/contatos')

  const { data: contact }: { data: Contact } = await res.json()

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/contatos" className="text-sm text-slate-500 hover:text-slate-900">← Contatos</Link>
        <h1 className="text-base font-semibold text-slate-900">{contact.name}</h1>
        <Link href={`/contatos/${contact.id}/editar`} className="ml-auto text-xs text-slate-500 border border-slate-200 rounded px-3 py-1.5 hover:bg-slate-50">
          ✏️ Editar
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 mb-5">
        {contact.jobTitle && (
          <div><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Cargo</span><p className="text-sm text-slate-700 mt-0.5">{contact.jobTitle}</p></div>
        )}
        {contact.email && (
          <div><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">E-mail</span><p className="text-sm text-slate-700 mt-0.5">{contact.email}</p></div>
        )}
        {contact.phone && (
          <div><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Telefone</span><p className="text-sm text-slate-700 mt-0.5">{contact.phone}</p></div>
        )}
        {contact.company && (
          <div><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Empresa</span><p className="text-sm text-slate-700 mt-0.5">{contact.company.name}</p></div>
        )}
        {contact.tags.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tags</span>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {contact.tags.map((tag) => (
                <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
              ))}
            </div>
          </div>
        )}
        {contact.notes && (
          <div><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Notas</span><p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{contact.notes}</p></div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Listas de Marketing</h2>
        <ContactListsSection contactId={contact.id} />
      </div>
    </div>
  )
}
