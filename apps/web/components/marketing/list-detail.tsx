'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { marketingApi } from '@/lib/api/marketing'
import MemberSearch from './member-search'
import type { MarketingList, MarketingListMember } from '@crm/shared'

interface ListDetailProps {
  list: MarketingList
  initialMembers: MarketingListMember[]
  initialTotal: number
  initialPage: number
}

export default function ListDetail({ list, initialMembers, initialTotal, initialPage }: ListDetailProps) {
  const router = useRouter()
  const [members, setMembers] = useState<MarketingListMember[]>(initialMembers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const totalPages = Math.ceil(total / 20)

  // Inline edit state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [editDesc, setEditDesc] = useState(list.description ?? '')
  const [saving, setSaving] = useState(false)

  async function handleAddMember(contactId: string, _contactName: string) {
    setError('')
    try {
      await marketingApi.addMembers(list.id, [contactId])
      const res = await marketingApi.listMembers(list.id, page)
      setMembers(res.data)
      setTotal(res.meta.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar contato')
    }
  }

  async function handleRemoveMember(contactId: string) {
    setError('')
    try {
      await marketingApi.removeMember(list.id, contactId)
      setMembers((prev) => prev.filter((m) => m.contactId !== contactId))
      setTotal((prev) => prev - 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover membro')
    }
  }

  async function handleDeleteList() {
    if (!confirm(`Excluir a lista "${list.name}"? Todos os ${total} membros serão removidos.`)) return
    setDeleting(true)
    try {
      await marketingApi.deleteList(list.id)
      router.push('/marketing')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir lista')
      setDeleting(false)
    }
  }

  async function loadPage(p: number) {
    const res = await marketingApi.listMembers(list.id, p)
    setMembers(res.data)
    setTotal(res.meta.total)
    setPage(p)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) return
    setSaving(true)
    setError('')
    try {
      await marketingApi.updateList(list.id, { name: editName.trim(), description: editDesc.trim() || undefined })
      router.refresh()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const memberContactIds = members.map((m) => m.contactId)

  return (
    <div className="p-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">← Voltar</button>
        {editing ? (
          <form onSubmit={handleSaveEdit} className="flex-1 flex items-center gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoFocus
              className="flex-1 border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" disabled={saving} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-50">{saving ? '...' : 'Salvar'}</button>
            <button type="button" onClick={() => setEditing(false)} className="px-3 py-1 text-xs border border-slate-200 rounded-lg">Cancelar</button>
          </form>
        ) : (
          <>
            <h1 className="text-base font-semibold text-slate-900">📋 {list.name}</h1>
            <button onClick={() => setEditing(true)} className="text-[10px] text-slate-400 hover:text-slate-700 border border-slate-200 rounded px-2 py-0.5">✏️ Editar</button>
            <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{total} contato{total !== 1 ? 's' : ''}</span>
          </>
        )}
      </div>
      {!editing && list.description && <p className="text-xs text-slate-400 mb-4">{list.description}</p>}
      {editing && (
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1">Descrição</label>
          <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Descrição opcional..." />
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <MemberSearch listId={list.id} memberContactIds={memberContactIds} onAdd={handleAddMember} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">E-mail</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400 text-xs">Nenhum contato nesta lista. Use a busca acima para adicionar.</td></tr>
            )}
            {members.map((m) => (
              <tr key={m.contactId} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-medium text-slate-900">{m.contact.name}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{m.contact.company?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{m.contact.email ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRemoveMember(m.contactId)}
                    className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                    title="Remover da lista"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
          <span>Mostrando {members.length} de {total}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => loadPage(p)} className={`w-7 h-7 rounded border text-xs font-medium ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{p}</button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-start">
        <button onClick={handleDeleteList} disabled={deleting} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
          {deleting ? 'Excluindo...' : '🗑️ Excluir lista'}
        </button>
      </div>
    </div>
  )
}
