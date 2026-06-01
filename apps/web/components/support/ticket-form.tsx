'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ticketsApi } from '@/lib/api/tickets'
import { companiesApi } from '@/lib/api/companies'
import { contactsApi } from '@/lib/api/contacts'
import { apiFetch } from '@/lib/api-client'
import type { Company, Contact, TicketPriority, TicketCategory } from '@crm/shared'

interface User { id: string; name: string }

interface FormState {
  title: string
  description: string
  priority: TicketPriority
  category: TicketCategory
  assigneeId: string
  contactId: string
  companyId: string
}

export default function TicketForm() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'OTHER',
    assigneeId: '',
    contactId: '',
    companyId: '',
  })

  useEffect(() => {
    Promise.all([
      companiesApi.list(),
      contactsApi.list({ limit: 100 }),
      apiFetch<{ data: User[] }>('/api/tasks/users-list'),
    ]).then(([c, ct, u]) => {
      setCompanies(c.data)
      setContacts(ct.data)
      setUsers(u.data)
    })
  }, [])

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await ticketsApi.create({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        category: form.category,
        assigneeId: form.assigneeId || undefined,
        contactId: form.contactId || undefined,
        companyId: form.companyId || undefined,
      })
      router.push('/suporte')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ticket')
      setSaving(false)
    }
  }

  return (
    <div className="p-5 max-w-xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Voltar</button>
        <h1 className="text-base font-semibold text-slate-900">Novo Ticket</h1>
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
            placeholder="Ex: Erro ao acessar relatório"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Descreva o problema ou solicitação..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Prioridade</label>
            <select
              value={form.priority}
              onChange={e => set('priority', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="BUG">Bug</option>
              <option value="QUESTION">Dúvida</option>
              <option value="REQUEST">Solicitação</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Responsável</label>
          <select
            value={form.assigneeId}
            onChange={e => set('assigneeId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Sem responsável</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Contato</label>
          <select
            value={form.contactId}
            onChange={e => set('contactId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Nenhum contato</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Empresa</label>
          <select
            value={form.companyId}
            onChange={e => set('companyId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Nenhuma empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Criar Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}
