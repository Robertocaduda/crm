'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { contactsApi } from '@/lib/api/contacts'
import { companiesApi } from '@/lib/api/companies'
import { tagsApi } from '@/lib/api/tags'
import type { Contact, Company, Tag, CreateContactDto } from '@crm/shared'

interface ContactFormProps {
  initial?: Contact
}

export default function ContactForm({ initial }: ContactFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<CreateContactDto>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    jobTitle: initial?.jobTitle ?? '',
    notes: initial?.notes ?? '',
    companyId: initial?.companyId ?? '',
    tagIds: initial?.tags.map((t) => t.id) ?? [],
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([companiesApi.list(), tagsApi.list()]).then(([c, t]) => {
      setCompanies(c.data)
      setTags(t.data)
    })
  }, [])

  function set(field: keyof CreateContactDto, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds?.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...(prev.tagIds ?? []), tagId],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: CreateContactDto = {
        ...form,
        email: form.email || undefined,
        phone: form.phone || undefined,
        jobTitle: form.jobTitle || undefined,
        notes: form.notes || undefined,
        companyId: form.companyId || undefined,
      }
      if (initial) {
        await contactsApi.update(initial.id, payload)
      } else {
        await contactsApi.create(payload)
      }
      router.push('/contatos')
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
        <h1 className="text-base font-semibold text-slate-900">{initial ? 'Editar Contato' : 'Novo Contato'}</h1>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Maria Silva" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
            <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@empresa.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Telefone</label>
            <input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="(11) 99999-0000" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Cargo</label>
          <input value={form.jobTitle ?? ''} onChange={(e) => set('jobTitle', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: CEO, Gerente de Compras" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Empresa</label>
          <select value={form.companyId ?? ''} onChange={(e) => set('companyId', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Nenhuma empresa</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = form.tagIds?.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="text-xs px-3 py-1 rounded-full border font-medium transition-colors"
                  style={selected ? { backgroundColor: tag.color, borderColor: tag.color, color: 'white' } : { borderColor: '#e2e8f0', color: '#475569' }}
                >
                  {selected ? '✓ ' : ''}{tag.name}
                </button>
              )
            })}
            {tags.length === 0 && <a href="/tags" className="text-xs text-indigo-600 hover:underline">Criar tags primeiro →</a>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
          <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Observações sobre este contato..." />
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
