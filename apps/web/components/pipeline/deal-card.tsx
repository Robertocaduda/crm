'use client'

import { useRouter } from 'next/navigation'
import { pipelineDealsApi } from '@/lib/api/pipeline-deals'
import type { Deal, PipelineStageSummary } from '@crm/shared'

interface DealCardProps {
  deal: Deal
  stages: PipelineStageSummary[]
  onUpdate: () => void
}

function formatCurrency(value: number | null) {
  if (value === null) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export default function DealCard({ deal, stages, onUpdate }: DealCardProps) {
  const router = useRouter()

  async function handleStageChange(stageId: string) {
    await pipelineDealsApi.update(deal.id, { stageId })
    onUpdate()
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:border-indigo-300 transition-colors">
      <button
        onClick={() => router.push(`/pipeline/deals/${deal.id}`)}
        className="text-left w-full"
      >
        <p className="text-xs font-semibold text-slate-900 leading-tight mb-1">{deal.title}</p>
        {deal.company && (
          <p className="text-[10px] text-slate-400 mb-1">{deal.company.name}</p>
        )}
        {deal.contact && !deal.company && (
          <p className="text-[10px] text-slate-400 mb-1">{deal.contact.name}</p>
        )}
        {deal.value !== null && (
          <p className="text-xs font-semibold text-indigo-600 mb-1">{formatCurrency(deal.value)}</p>
        )}
        {deal.probability !== null && (
          <p className="text-[10px] text-slate-400">{deal.probability}% de chance</p>
        )}
      </button>

      <div className="mt-2 pt-2 border-t border-slate-100">
        <select
          value={deal.stageId}
          onChange={(e) => handleStageChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
