'use client'

import { useRouter } from 'next/navigation'
import { pipelineDealsApi } from '@/lib/api/pipeline-deals'
import type { Deal, PipelineStageSummary } from '@crm/shared'

interface DealTableProps {
  groups: { stage: PipelineStageSummary; deals: Deal[] }[]
  stages: PipelineStageSummary[]
  onUpdate: () => void
}

function formatCurrency(value: number | null) {
  if (value === null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

export default function DealTable({ groups, stages, onUpdate }: DealTableProps) {
  const router = useRouter()
  const allDeals = groups.flatMap((g) => g.deals)

  async function handleStageChange(dealId: string, stageId: string) {
    await pipelineDealsApi.update(dealId, { stageId })
    onUpdate()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Negociação</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estágio</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prob.</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Previsão</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa / Contato</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allDeals.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Nenhuma negociação aberta.</td></tr>
          )}
          {allDeals.map((deal) => (
            <tr key={deal.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="text-xs font-medium text-slate-900">{deal.title}</p>
              </td>
              <td className="px-4 py-3">
                <select
                  value={deal.stageId}
                  onChange={(e) => handleStageChange(deal.id, e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-indigo-600">{formatCurrency(deal.value)}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{deal.probability !== null ? `${deal.probability}%` : '—'}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatDate(deal.expectedCloseAt)}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{deal.company?.name ?? deal.contact?.name ?? '—'}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => router.push(`/pipeline/deals/${deal.id}`)}
                  className="text-[10px] text-slate-500 hover:text-slate-900 border border-slate-200 rounded px-2 py-1"
                >
                  ✏️ Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
