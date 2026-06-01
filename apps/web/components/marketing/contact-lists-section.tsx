'use client'

import { useState, useEffect } from 'react'
import { marketingApi } from '@/lib/api/marketing'
import type { MarketingList } from '@crm/shared'

interface ContactListsSectionProps {
  contactId: string
}

export default function ContactListsSection({ contactId }: ContactListsSectionProps) {
  const [allLists, setAllLists] = useState<MarketingList[]>([])
  const [memberListIds, setMemberListIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await marketingApi.listLists()
        setAllLists(res.data)
        const checks = await Promise.all(
          res.data.map(async (list) => {
            try {
              const members = await marketingApi.listMembers(list.id, 1)
              const found = members.data.some((m) => m.contactId === contactId)
              return found ? list.id : null
            } catch {
              return null
            }
          })
        )
        setMemberListIds(checks.filter(Boolean) as string[])
      } catch {
        setError('Erro ao carregar listas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contactId])

  async function handleRemove(listId: string) {
    setError('')
    try {
      await marketingApi.removeMember(listId, contactId)
      setMemberListIds((prev) => prev.filter((id) => id !== listId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
    }
  }

  const memberLists = allLists.filter((l) => memberListIds.includes(l.id))

  if (loading) return <p className="text-xs text-slate-400">Carregando listas...</p>

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {memberLists.length === 0 && (
          <p className="text-xs text-slate-400">Este contato não está em nenhuma lista.</p>
        )}
        {memberLists.map((list) => (
          <span
            key={list.id}
            className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs px-3 py-1 rounded-full"
          >
            📋 {list.name}
            <button
              onClick={() => handleRemove(list.id)}
              className="text-violet-400 hover:text-violet-700 transition-colors ml-0.5"
              title="Remover desta lista"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
