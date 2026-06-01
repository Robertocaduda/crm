'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ticketsApi } from '@/lib/api/tickets'
import TicketCard from './ticket-card'
import type { Ticket, TicketStatus } from '@crm/shared'

interface TicketGroup {
  status: TicketStatus
  tickets: Ticket[]
}

const COLUMN_CONFIG: Record<TicketStatus, { label: string; headerClass: string; emptyMsg: string }> = {
  OPEN:        { label: 'Aberto',       headerClass: 'text-blue-600',  emptyMsg: 'Nenhum ticket aberto' },
  IN_PROGRESS: { label: 'Em andamento', headerClass: 'text-amber-600', emptyMsg: 'Nenhum ticket em andamento' },
  RESOLVED:    { label: 'Resolvido',    headerClass: 'text-green-600', emptyMsg: 'Nenhum ticket resolvido' },
}

export default function TicketBoard() {
  const [groups, setGroups] = useState<TicketGroup[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ticketsApi.listKanban()
      setGroups(res.data)
    } catch {
      // silently keep empty groups on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const totalOpen = groups.find(g => g.status === 'OPEN')?.tickets.length ?? 0
  const totalInProgress = groups.find(g => g.status === 'IN_PROGRESS')?.tickets.length ?? 0

  return (
    <div className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {totalOpen > 0 && <span className="text-blue-600 font-semibold">{totalOpen} aberto{totalOpen !== 1 ? 's' : ''}</span>}
          {totalInProgress > 0 && <span className="text-amber-600 font-semibold">{totalInProgress} em andamento</span>}
        </div>
        <Link href="/suporte/tickets/novo" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">
          + Novo Ticket
        </Link>
      </div>

      {loading && <p className="text-slate-400 text-sm">Carregando...</p>}

      {/* Kanban */}
      {!loading && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as TicketStatus[]).map((status) => {
            const group = groups.find(g => g.status === status)
            const tickets = group?.tickets ?? []
            const config = COLUMN_CONFIG[status]

            return (
              <div key={status} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold ${config.headerClass}`}>{config.label}</span>
                  <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{tickets.length}</span>
                </div>
                <div className="space-y-2">
                  {tickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                  {tickets.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-slate-400">{config.emptyMsg}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
