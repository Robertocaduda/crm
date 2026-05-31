'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { companiesApi } from '@/lib/api/companies'
import type { Company } from '@crm/shared'

const LOGO_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#22c55e','#3b82f6','#14b8a6','#ef4444']

function logoColor(name: string) {
  return LOGO_COLORS[name.charCodeAt(0) % LOGO_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function CompanyGrid() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(s?: string) {
    setLoading(true)
    try {
      const res = await companiesApi.list(s)
      setCompanies(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300)
    return () => clearTimeout(t)
  }, [search])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Os contatos vinculados serão mantidos.`)) return
    await companiesApi.delete(id)
    await load(search || undefined)
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nome..."
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        <Link href="/empresas/novo" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          + Nova Empresa
        </Link>
      </div>
      {loading && <p className="text-slate-400 text-sm">Carregando...</p>}
      {!loading && companies.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">Nenhuma empresa encontrada.</p>
          <Link href="/empresas/novo" className="mt-3 inline-block text-indigo-600 text-sm hover:underline">Criar primeira empresa →</Link>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: logoColor(company.name) }}>
                {initials(company.name)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{company.name}</p>
                {company.sector && <p className="text-xs text-slate-400 truncate">{company.sector}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
              {company._count !== undefined && (
                <span>👥 {company._count.contacts} contato{company._count.contacts !== 1 ? 's' : ''}</span>
              )}
              {company.website && <span className="truncate">🌐 {company.website}</span>}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => router.push(`/empresas/${company.id}/editar`)} className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 rounded px-2 py-1">✏️ Editar</button>
              <button onClick={() => handleDelete(company.id, company.name)} className="text-xs text-red-400 hover:text-red-600 border border-slate-200 rounded px-2 py-1">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
