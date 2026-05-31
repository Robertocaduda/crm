'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { tasksApi } from '@/lib/api/tasks'
import type { Task, PaginationMeta } from '@crm/shared'

type QuickFilter = 'all' | 'today' | 'week' | 'overdue' | 'mine'

const FILTERS: { key: QuickFilter; label: string; danger?: boolean }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' },
  { key: 'overdue', label: 'Atrasadas', danger: true },
  { key: 'mine', label: 'Minhas' },
]

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  HIGH: { label: '🔴 Alta', className: 'bg-red-100 text-red-700' },
  MEDIUM: { label: '🟡 Média', className: 'bg-amber-100 text-amber-700' },
  LOW: { label: '⚪ Baixa', className: 'bg-slate-100 text-slate-500' },
}

const EMPTY_MESSAGES: Record<QuickFilter, string> = {
  all: 'Nenhuma tarefa cadastrada.',
  today: 'Nenhuma tarefa para hoje. ✅',
  week: 'Nenhuma tarefa para esta semana.',
  overdue: 'Nenhuma tarefa atrasada. ✅',
  mine: 'Nenhuma tarefa atribuída a você.',
}

function formatDueAt(dueAt: string | null): { text: string; className: string } {
  if (!dueAt) return { text: '—', className: 'text-slate-400' }
  const date = new Date(dueAt)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  if (date < today) return { text: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), className: 'text-red-600 font-semibold' }
  if (date < tomorrow) return { text: 'Hoje', className: 'text-amber-600 font-semibold' }
  return { text: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), className: 'text-slate-500' }
}

export default function TaskList() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  const load = useCallback(async (filter: QuickFilter, p: number) => {
    setLoading(true)
    try {
      const query = filter === 'all' ? { page: p } : { filter: filter as any, page: p }
      const res = await tasksApi.list(query)
      setTasks(res.data)
      setMeta(res.meta)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    load(activeFilter, 1)
  }, [activeFilter, load])

  useEffect(() => {
    load(activeFilter, page)
  }, [page, activeFilter, load])

  async function handleComplete(task: Task) {
    if (task.status === 'DONE') return
    setCompleting(task.id)
    try {
      await tasksApi.update(task.id, { status: 'DONE' })
      await load(activeFilter, page)
    } finally {
      setCompleting(null)
    }
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Quick filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeFilter === f.key
                  ? f.danger
                    ? 'bg-red-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : f.danger
                  ? 'bg-white text-red-500 border border-red-200 hover:bg-red-50'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link href="/tarefas/nova" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">
          + Nova Tarefa
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-8 px-4 py-2.5"></th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarefa</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prazo</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioridade</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Responsável</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vínculo</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Carregando...</td></tr>
            )}
            {!loading && tasks.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">{EMPTY_MESSAGES[activeFilter]}</td></tr>
            )}
            {tasks.map((task) => {
              const isDone = task.status === 'DONE'
              const due = formatDueAt(task.dueAt)
              const priority = PRIORITY_BADGE[task.priority]
              const link = task.company?.name ?? task.contact?.name ?? task.deal?.title ?? null

              return (
                <tr key={task.id} className={`hover:bg-slate-50 ${isDone ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <button
                      disabled={completing === task.id || isDone}
                      onClick={() => handleComplete(task)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isDone
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {isDone && <span className="text-[9px] leading-none">✓</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-xs font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    {task.recurrence !== 'NONE' && (
                      <p className="text-[10px] text-indigo-400 mt-0.5">
                        {task.recurrence === 'DAILY' ? '🔁 Diária' : task.recurrence === 'WEEKLY' ? '🔁 Semanal' : '🔁 Mensal'}
                      </p>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-xs ${due.className}`}>{due.text}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priority.className}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{task.assignee.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{link ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/tarefas/${task.id}`)}
                      className="text-[10px] text-slate-500 hover:text-slate-900 border border-slate-200 rounded px-2 py-1"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>Mostrando {tasks.length} de {meta.total} tarefas</span>
          <div className="flex gap-1">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded border text-xs font-medium ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
