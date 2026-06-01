'use client'

import { useState, useRef, useEffect } from 'react'
import { contactsApi } from '@/lib/api/contacts'
import type { Contact } from '@crm/shared'

interface MemberSearchProps {
  listId: string
  memberContactIds: string[]
  onAdd: (contactId: string, contactName: string) => Promise<void>
}

export default function MemberSearch({ listId: _listId, memberContactIds, onAdd }: MemberSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contact[]>([])
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      try {
        const res = await contactsApi.list({ search: query, limit: 8 })
        setResults(res.data)
        setOpen(true)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSelect(contact: Contact) {
    if (memberContactIds.includes(contact.id)) return
    setAdding(contact.id)
    try {
      await onAdd(contact.id, contact.name)
      setQuery('')
      setOpen(false)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div ref={ref} className="relative mb-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar e adicionar contato..."
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto">
          {results.map((contact) => {
            const isMember = memberContactIds.includes(contact.id)
            return (
              <button
                key={contact.id}
                onClick={() => handleSelect(contact)}
                disabled={isMember || adding === contact.id}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isMember ? 'opacity-40' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{contact.name}</p>
                  {contact.company && <p className="text-[10px] text-slate-400 truncate">{contact.company.name}</p>}
                </div>
                {isMember && <span className="text-[10px] text-slate-400 flex-shrink-0">já membro</span>}
                {adding === contact.id && <span className="text-[10px] text-indigo-600 flex-shrink-0">adicionando...</span>}
              </button>
            )
          })}
        </div>
      )}
      {open && results.length === 0 && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 px-3 py-3 text-xs text-slate-400">
          Nenhum contato encontrado para &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}
