'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { pipelineDealsApi } from '@/lib/api/pipeline-deals'
import DealCard from './deal-card'
import DealTable from './deal-table'
import type { Deal, DealsGroupedByStage } from '@crm/shared'

export default function DealBoard() {
  const [groups, setGroups] = useState<DealsGroupedByStage[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'board' | 'lista'>('board')

  const stages = groups.map((g) => g.stage)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pipelineDealsApi.listOpen()
      setGroups(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Prisma Decimal serializes as string in JSON — coerce to Number before arithmetic
  const totalValue = groups
    .flatMap((g) => g.deals)
    .reduce((sum, d) => sum + Number(d.value ?? 0), 0)

  const totalDeals = groups.flatMap((g) => g.deals).length

  return (
    <div className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{totalDeals} negociações</span>
            {totalValue > 0 && (
              <span className="font-semibold text-indigo-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValue)} em aberto
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle view */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'board' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              ⊞ Board
            </button>
            <button
              onClick={() => setView('lista')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'lista' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              ≡ Lista
            </button>
          </div>
          <Link href="/pipeline/deals/novo" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">
            + Novo Deal
          </Link>
        </div>
      </div>

      {loading && <p className="text-slate-400 text-sm">Carregando...</p>}

      {/* Board view */}
      {!loading && view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {groups.map((group) => (
            <div key={group.stage.id} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.stage.color }}
                />
                <span className="text-xs font-semibold text-slate-700">{group.stage.name}</span>
                <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{group.deals.length}</span>
              </div>
              {/* Cards */}
              <div className="space-y-2">
                {group.deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} stages={stages} onUpdate={load} />
                ))}
                {group.deals.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-[10px] text-slate-400">Sem deals</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <p className="text-sm mb-2">Nenhum estágio configurado.</p>
              <Link href="/configuracoes/pipeline" className="text-xs text-indigo-600 hover:underline">Configurar estágios →</Link>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {!loading && view === 'lista' && (
        <DealTable groups={groups} stages={stages} onUpdate={load} />
      )}
    </div>
  )
}
