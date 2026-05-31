'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { tasksApi } from '@/lib/api/tasks'
import { companiesApi } from '@/lib/api/companies'
import { contactsApi } from '@/lib/api/contacts'
import { pipelineDealsApi } from '@/lib/api/pipeline-deals'
import { apiFetch } from '@/lib/api-client'
import type { Task, Company, Contact, Deal, CreateTaskDto } from '@crm/shared'

interface User { id: string; name: string }

interface TaskFormProps {
  initial?: Task
}

export default function TaskForm({ initial }: TaskFormProps) {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<CreateTaskDto & { status?: string }>({
    title: initial?.title ?? '',
    assigneeId: initial?.assigneeId ?? '',
    notes: initial?.notes ?? '',
    dueAt: initial?.dueAt ? new Date(initial.dueAt).toISOString().split('T')[0] : '',
    priority: initial?.priority ?? 'MEDIUM',
    recurrence: initial?.recurrence ?? 'NONE',
    recurrenceEndAt: initial?.recurrenceEndAt ? new Date(initial.recurrenceEndAt).toISOString().split('T')[0] : '',
    contactId: initial?.contactId ?? '',
    companyId: initial?.companyId ?? '',
    dealId: initial?.dealId ?? '',
    status: initial?.status ?? 'PENDING',
  })

  useEffect(() => {
    Promise.all([
      companiesApi.list(),
      contactsApi.list({ limit: 100 }),
      pipelineDealsApi.listOpen(),
      apiFetch<{ data: User[] }>('/api/tasks/users-list'),
    ]).then(([c, ct, d, u]) => {
      setCompanies(c.data)
      setContacts(ct.data)
      // flatten deals from grouped response
      setDeals(d.data.flatMap((g: any) => g.deals))
      setUsers(u.data)
      // pre-select first user when creating
      if (!initial && u.data.length > 0) {
        setForm(prev => ({ ...prev, assigneeId: u.data[0].id }))
      }
    })
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: any = {
        title: form.title,
        assigneeId: form.assigneeId,
        notes: (form.notes as string) || undefined,
        dueAt: (form.dueAt as string) || undefined,
        priority: form.priority,
        recurrence: form.recurrence,
        recurrenceEndAt: (form.recurrenceEndAt as string) || undefined,
        contactId: (form.contactId as string) || undefined,
        companyId: (form.companyId as string) || undefined,
        dealId: (form.dealId as string) || undefined,
      }
      if (initial) {
        await tasksApi.update(initial.id, { ...payload, status: form.status as any })
      } else {
        await tasksApi.create(payload)
      }
      router.push('/tarefas')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initial) return
    if (!confirm('Excluir esta tarefa? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      await tasksApi.delete(initial.id)
      router.push('/tarefas')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
      setDeleting(false)
    }
  }

  const showRecurrenceEnd = form.recurrence && form.recurrence !== 'NONE'

  return (
    <div className="p-5 max-w-xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Voltar</button>
        <h1 className="text-base font-semibold text-slate-900">{initial ? 'Editar Tarefa' : 'Nova Tarefa'}</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Título *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Ligar para cliente"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Prazo</label>
            <input
              type="date"
              value={(form.dueAt as string) ?? ''}
              onChange={e => set('dueAt', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Prioridade</label>
            <select
              value={form.priority}
              onChange={e => set('priority', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="HIGH">🔴 Alta</option>
              <option value="MEDIUM">🟡 Média</option>
              <option value="LOW">⚪ Baixa</option>
            </select>
          </div>
        </div>

        {initial && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="DONE">Concluída</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Recorrência</label>
          <select
            value={form.recurrence}
            onChange={e => set('recurrence', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="NONE">Nenhuma</option>
            <option value="DAILY">Diária</option>
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensal</option>
          </select>
        </div>

        {showRecurrenceEnd && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Data limite da recorrência</label>
            <input
              type="date"
              value={(form.recurrenceEndAt as string) ?? ''}
              onChange={e => set('recurrenceEndAt', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Responsável *</label>
          <select
            value={form.assigneeId}
            onChange={e => set('assigneeId', e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Selecione um responsável</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Vínculo com Contato</label>
          <select
            value={(form.contactId as string) ?? ''}
            onChange={e => set('contactId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Nenhum contato</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Vínculo com Empresa</label>
          <select
            value={(form.companyId as string) ?? ''}
            onChange={e => set('companyId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Nenhuma empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Vínculo com Deal</label>
          <select
            value={(form.dealId as string) ?? ''}
            onChange={e => set('dealId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Nenhum deal</option>
            {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas</label>
          <textarea
            value={(form.notes as string) ?? ''}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Observações sobre esta tarefa..."
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
              {deleting ? 'Excluindo...' : '🗑️ Excluir'}
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
    </div>
  )
}
