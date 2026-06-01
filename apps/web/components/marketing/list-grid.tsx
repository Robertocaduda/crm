import Link from 'next/link'
import ListCard from './list-card'
import type { MarketingList } from '@crm/shared'

interface ListGridProps {
  lists: MarketingList[]
}

export default function ListGrid({ lists }: ListGridProps) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-base font-semibold text-slate-900">Listas de Marketing</h1>
        <Link
          href="/marketing/listas/novo"
          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
        >
          + Nova Lista
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
        {lists.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400 text-sm">
            Nenhuma lista criada ainda.{' '}
            <Link href="/marketing/listas/novo" className="text-indigo-600 hover:underline">Criar a primeira</Link>
          </div>
        )}
      </div>
    </div>
  )
}
