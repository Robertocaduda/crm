'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ticketsApi } from '@/lib/api/tickets'
import TicketComment from './ticket-comment'
import type { Ticket, UpdateTicketDto, TicketStatus, TicketPriority, TicketCategory } from '@crm/shared'

interface TicketDetailProps {
  initial: Ticket
}

export default function TicketDetail({ initial }: TicketDetailProps) {
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket>(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [commenting, setCommenting] = useState(false)

  const [form, setForm] = useState({
    title: ticket.title,
    description: ticket.description ?? '',
    status: ticket.status as string,
    priority: ticket.priority as string,
    category: ticket.category as string,
    resolution: ticket.resolution ?? '',
    assigneeId: ticket.assigneeId ?? '',
    contactId: ticket.contactId ?? '',
    companyId: ticket.companyId ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const dto: UpdateTicketDto = {
        title: form.title,
        description: form.description || undefined,
        status: form.status as TicketStatus,
        priority: form.priority as TicketPriority,
        category: form.category as TicketCategory,
        resolution: form.resolution || undefined,
        assigneeId: form.assigneeId || undefined,
        contactId: form.contactId || undefined,
        companyId: form.companyId || undefined,
      }
      const updated = await ticketsApi.update(ticket.id, dto)
      setTicket(updated.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir o ticket #${ticket.number}? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    try {
      await ticketsApi.delete(ticket.id)
      router.push('/suporte')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
      setDeleting(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    setCommenting(true)
    setError('')
    try {
      const res = await ticketsApi.addComment(ticket.id, commentBody.trim())
      setTicket(prev => ({ ...prev, comments: [...prev.comments, res.data] }))
      setCommentBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comentar')
    } finally {
      setCommenting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Excluir este comentário?')) return
    setError('')
    try {
      await ticketsApi.deleteComment(ticket.id, commentId)
      setTicket(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== commentId) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir comentário')
    }
  }

  return (
    <div className="p-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Voltar</button>
        <span className="text-xs font-mono text-slate-400">#{ticket.number}</span>
        <select
          value={form.status}
          onChange={e => set('status', e.target.value)}
          className="ml-auto text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="OPEN">Aberto</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="RESOLVED">Resolvido</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Título *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Prioridade</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="HIGH">🔴 Alta</option>
              <option value="MEDIUM">🟡 Média</option>
              <option value="LOW">⚪ Baixa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="BUG">🐛 Bug</option>
              <option value="QUESTION">❓ Dúvida</option>
              <option value="REQUEST">📋 Solicitação</option>
              <option value="OTHER">📌 Outro</option>
            </select>
          </div>
        </div>

        {form.status === 'RESOLVED' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Resolução</label>
            <textarea
              value={form.resolution}
              onChange={e => set('resolution', e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Descreva como o ticket foi resolvido..."
            />
          </div>
        )}

        <div className="flex justify-between items-center pt-1">
          <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
            {deleting ? 'Excluindo...' : '🗑️ Excluir'}
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      {/* Thread de comentários */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Comentários {ticket.comments.length > 0 && <span className="text-slate-400 font-normal">({ticket.comments.length})</span>}
        </h3>

        {ticket.comments.length === 0 && (
          <p className="text-xs text-slate-400 mb-4">Nenhum comentário ainda.</p>
        )}

        <div className="space-y-4 mb-4">
          {ticket.comments.map(comment => (
            <TicketComment
              key={comment.id}
              author={comment.author.name}
              body={comment.body}
              createdAt={comment.createdAt}
              onDelete={() => handleDeleteComment(comment.id)}
            />
          ))}
        </div>

        {/* Add comment */}
        <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-4">
          <textarea
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            rows={3}
            placeholder="Adicionar comentário..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={commenting || !commentBody.trim()}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {commenting ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
