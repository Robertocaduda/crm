'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { pipelineDealsApi } from '@/lib/api/pipeline-deals'
import { pipelineStagesApi } from '@/lib/api/pipeline-stages'
import { companiesApi } from '@/lib/api/companies'
import { contactsApi } from '@/lib/api/contacts'
import type { Deal, PipelineStage, Company, Contact, CreateDealDto } from '@crm/shared'

interface DealFormProps {
  initial?: Deal
  defaultStageId?: string
}

export default function DealForm({ initial, defaultStageId }: DealFormProps) {
  const router = useRouter()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<CreateDealDto>({
    title: initial?.title ?? '',
    stageId: initial?.stageId ?? defaultStageId ?? '',
    value: initial?.value ?? undefined,
    probability: initial?.probability ?? undefined,
    expectedCloseAt: initial?.expectedCloseAt
      ? new Date(initial.expectedCloseAt).toISOString().split('T')[0]
      : '',
    notes: initial?.notes ?? '',
    contactId: initial?.contactId ?? '',
    companyId: initial?.companyId ?? '',
  })

  useEffect(() => {
    Promise.all([
      pipelineStagesApi.list(),
      companiesApi.list(),
      contactsApi.list({ limit: 100 }),
    ]).then(([s, c, ct]) => {
      setStages(s.data)
      setCompanies(c.data)
      setContacts(ct.data)
      if (!form.stageId && s.data.length > 0) {
        setForm((prev) => ({ ...prev, stageId: s.data[0].id }))
      }
    })
  }, [])

  function set(field: keyof CreateDealDto, value: string | number | undefined) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: CreateDealDto = {
        ...form,
        value: form.value ? Number(form.value) : undefined,
        probability: form.probability ? Number(form.probability) : undefined,
        expectedCloseAt: (form.expectedCloseAt as string) || undefined,
        contactId: (form.contactId as string) || undefined,
        companyId: (form.companyId as string) || undefined,
        notes: (form.notes as string) || undefined,
      }
      if (initial) {
        await pipelineDealsApi.update(initial.id, payload)
      } else {
        await pipelineDealsApi.create(payload)
      }
      router.push('/pipeline')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      setSaving(false)
    }
  }

  async function handleMarkStatus(status: 'WON' | 'LOST') {
    if (!initial) return
    const label = status === 'WON' ? 'Ganha' : 'Perdida'
    if (!confirm(`Marcar esta negociação como ${label}? Ela será movida para o Histórico.`)) return
    try {
      await pipelineDealsApi.update(initial.id, { status })
      router.push('/pipeline/historico')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status')
    }
  }

  async function handleDelete() {
    if (!initial) return
    if (!confirm('Excluir esta negociação? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      await pipelineDealsApi.delete(initial.id)
      router.push('/pipeline')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
      setDeleting(false)
    }
  }

  return (
    <div className="p-5 max-w-xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Voltar</button>
        <h1 className="text-base font-semibold text-slate-900">{initial ? 'Editar Negociação' : 'Nova Negociação'}</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Título *</label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Contrato Tech Solutions Q3"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Estágio *</label>
          <select
            value={form.stageId}
            onChange={(e) => set('stageId', e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Selecione um estágio</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Valor (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.value ?? ''}
              onChange={(e) => set('value', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Probabilidade (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.probability ?? ''}
              onChange={(e) => set('probability', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0–100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Previsão de fechamento</label>
          <input
            type="date"
            value={(form.expectedCloseAt as string) ?? ''}
            onChange={(e) => set('expectedCloseAt', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Empresa</label>
          <select
            value={(form.companyId as string) ?? ''}
            onChange={(e) => set('companyId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Nenhuma empresa</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Contato</label>
          <select
            value={(form.contactId as string) ?? ''}
            onChange={(e) => set('contactId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Nenhum contato</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
          <textarea
            value={(form.notes as string) ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Observações sobre esta negociação..."
          />
        </div>

        <div className="flex justify-between items-center pt-1">
          {initial ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>

      {initial && initial.status === 'OPEN' && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-600 mb-3">Resultado da negociação</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleMarkStatus('WON')}
              className="flex-1 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Marcar como Ganha
            </button>
            <button
              onClick={() => handleMarkStatus('LOST')}
              className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Marcar como Perdida
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
