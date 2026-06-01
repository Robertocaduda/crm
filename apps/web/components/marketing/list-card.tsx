'use client'

import { useRouter } from 'next/navigation'
import type { MarketingList } from '@crm/shared'

interface ListCardProps {
  list: MarketingList
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ListCard({ list }: ListCardProps) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(`/marketing/listas/${list.id}`)}
      className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-900 leading-tight">📋 {list.name}</p>
      </div>
      {list.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{list.description}</p>
      )}
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>👥 {list.memberCount} contato{list.memberCount !== 1 ? 's' : ''}</span>
        <span>{formatDate(list.createdAt)}</span>
      </div>
    </div>
  )
}
