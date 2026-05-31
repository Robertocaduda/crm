'use client'

import { useState, useEffect } from 'react'
import { pipelineDealsApi } from '@/lib/api/pipeline-deals'
import type { Deal, PaginationMeta } from '@crm/shared'

function formatCurrency(value: number | null) {
  if (value === null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

type Tab = 'WON' | 'LOST'

export default function HistoryTable() {
  const [tab, setTab] = useState<Tab>('WON')
  const [deals, setDeals] = useState<Deal[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPage(1)
  }, [tab])

  useEffect(() => {
    setLoading(true)
    pipelineDealsApi.listClosed(tab, page).then((res) => {
      setDeals(res.data)
      setMeta(res.meta)
    }).finally(() => setLoading(false))
  }, [tab, page])

  return (
    <div className="p-5">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('WON')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'WON' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          ✅ Ganhas
        </button>
        <button
          onClick={() => setTab('LOST')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'LOST' ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          ❌ Perdidas
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Negociação</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa / Contato</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fechado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Carregando...</td></tr>
            )}
            {!loading && deals.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Nenhuma negociação {tab === 'WON' ? 'ganha' : 'perdida'} ainda.</td></tr>
            )}
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-medium text-slate-900">{deal.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${deal.status === 'WON' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {deal.status === 'WON' ? 'Ganha' : 'Perdida'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-indigo-600">{formatCurrency(deal.value)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{deal.company?.name ?? deal.contact?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{formatDate(deal.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>Mostrando {deals.length} de {meta.total}</span>
          <div className="flex gap-1">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded border text-xs font-medium ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
