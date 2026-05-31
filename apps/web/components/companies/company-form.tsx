'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { companiesApi } from '@/lib/api/companies'
import type { Company, CreateCompanyDto } from '@crm/shared'

interface CompanyFormProps {
  initial?: Company
}

export default function CompanyForm({ initial }: CompanyFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<CreateCompanyDto>({
    name: initial?.name ?? '',
    website: initial?.website ?? '',
    phone: initial?.phone ?? '',
    sector: initial?.sector ?? '',
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof CreateCompanyDto, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (initial) {
        await companiesApi.update(initial.id, form)
      } else {
        await companiesApi.create(form)
      }
      router.push('/empresas')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      setSaving(false)
    }
  }

  return (
    <div className="p-5 max-w-xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Voltar</button>
        <h1 className="text-base font-semibold text-slate-900">{initial ? 'Editar Empresa' : 'Nova Empresa'}</h1>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Tech Solutions" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Website</label>
            <input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="empresa.com.br" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Telefone</label>
            <input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="(11) 3000-0000" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Setor</label>
          <input value={form.sector ?? ''} onChange={(e) => set('sector', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Tecnologia, Saúde, Indústria" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
          <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Observações..." />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
