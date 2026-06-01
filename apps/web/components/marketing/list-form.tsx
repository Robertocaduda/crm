'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { marketingApi } from '@/lib/api/marketing'
import type { CreateMarketingListDto } from '@crm/shared'

export default function ListForm() {
  const router = useRouter()
  const [form, setForm] = useState<CreateMarketingListDto>({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof CreateMarketingListDto, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await marketingApi.createList({
        name: form.name,
        description: form.description || undefined,
      })
      router.push(`/marketing/listas/${res.data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lista')
      setSaving(false)
    }
  }

  return (
    <div className="p-5 max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Voltar</button>
        <h1 className="text-base font-semibold text-slate-900">Nova Lista</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome *</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Clientes Ativos"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Descreva o objetivo desta lista..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Criando...' : 'Criar Lista'}
          </button>
        </div>
      </form>
    </div>
  )
}
