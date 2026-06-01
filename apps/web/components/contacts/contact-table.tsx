'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { contactsApi } from '@/lib/api/contacts'
import { tagsApi } from '@/lib/api/tags'
import TagFilter from './tag-filter'
import DeleteModal from './delete-modal'
import type { Contact, Tag, PaginationMeta } from '@crm/shared'

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#22c55e','#3b82f6','#14b8a6','#ef4444']

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function ContactTable() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)

  const loadContacts = useCallback(async (s: string, tagId: string | null, p: number) => {
    setLoading(true)
    try {
      const res = await contactsApi.list({ search: s || undefined, tagId: tagId || undefined, page: p, limit: 20 })
      setContacts(res.data)
      setMeta(res.meta)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { tagsApi.list().then((r) => setTags(r.data)) }, [])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadContacts(search, selectedTagId, 1) }, 300)
    return () => clearTimeout(t)
  }, [search, selectedTagId, loadContacts])

  useEffect(() => { loadContacts(search, selectedTagId, page) }, [page, loadContacts, search, selectedTagId])

  async function handleDelete() {
    if (!deleteTarget) return
    await contactsApi.delete(deleteTarget.id)
    setDeleteTarget(null)
    await loadContacts(search, selectedTagId, page)
  }

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por nome ou e-mail..."
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <Link href="/contatos/novo" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
            + Novo Contato
          </Link>
        </div>
        <div className="mb-4">
          <TagFilter tags={tags} selectedTagId={selectedTagId} onSelect={(id) => { setSelectedTagId(id); setPage(1) }} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tags</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">E-mail</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Carregando...</td></tr>}
              {!loading && contacts.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Nenhum contato encontrado.</td></tr>}
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button onClick={() => router.push(`/contatos/${contact.id}`)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: avatarColor(contact.name) }}>
                        {initials(contact.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-xs">{contact.name}</p>
                        {contact.jobTitle && <p className="text-[10px] text-slate-400">{contact.jobTitle}</p>}
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {contact.company ? <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{contact.company.name}</span> : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.map((tag) => (
                        <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{contact.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => router.push(`/contatos/${contact.id}/editar`)} className="text-[10px] text-slate-500 hover:text-slate-900 border border-slate-200 rounded px-2 py-1">✏️</button>
                      <button onClick={() => setDeleteTarget(contact)} className="text-[10px] text-red-400 hover:text-red-600 border border-slate-200 rounded px-2 py-1">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Mostrando {contacts.length} de {meta.total} contatos</span>
            <div className="flex gap-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded border text-xs font-medium ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
