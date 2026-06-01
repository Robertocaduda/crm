'use client'

import { useRouter } from 'next/navigation'
import type { Ticket } from '@crm/shared'

interface TicketCardProps {
  ticket: Ticket
}

const CATEGORY_BADGE: Record<string, { label: string; className: string }> = {
  BUG:      { label: 'Bug',        className: 'bg-red-100 text-red-700' },
  QUESTION: { label: 'Dúvida',     className: 'bg-blue-100 text-blue-700' },
  REQUEST:  { label: 'Solicitação',className: 'bg-purple-100 text-purple-700' },
  OTHER:    { label: 'Outro',      className: 'bg-slate-100 text-slate-500' },
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH:   'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-slate-300',
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const router = useRouter()
  const cat = CATEGORY_BADGE[ticket.category]

  return (
    <div
      onClick={() => router.push(`/suporte/tickets/${ticket.id}`)}
      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
        <span className="text-[10px] font-mono text-slate-400">#{ticket.number}</span>
        <span className={`ml-auto text-[9px] font-medium px-2 py-0.5 rounded-full ${cat.className}`}>
          {cat.label}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-900 leading-tight mb-2 line-clamp-2">{ticket.title}</p>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>{ticket.assignee?.name ?? 'Sem responsável'}</span>
        {ticket.comments.length > 0 && (
          <span>💬 {ticket.comments.length}</span>
        )}
      </div>
      {(ticket.company || ticket.contact) && (
        <p className="text-[10px] text-slate-400 mt-1 truncate">
          {ticket.company?.name ?? ticket.contact?.name}
        </p>
      )}
    </div>
  )
}
