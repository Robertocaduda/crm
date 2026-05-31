'use client'

import { useState, useEffect } from 'react'
import { pipelineStagesApi } from '@/lib/api/pipeline-stages'
import type { PipelineStage } from '@crm/shared'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6',
  '#64748b', '#0f172a',
]

export default function StageManager() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await pipelineStagesApi.list()
      setStages(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    try {
      await pipelineStagesApi.create({ name: newName.trim(), color: newColor })
      setNewName('')
      setNewColor('#6366f1')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar estágio')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    setError('')
    try {
      await pipelineStagesApi.update(id, { name: editName.trim(), color: editColor })
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar estágio')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o estágio "${name}"? Só é possível se não houver deals vinculados.`)) return
    setError('')
    try {
      await pipelineStagesApi.delete(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir estágio')
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newStages = [...stages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newStages.length) return
    ;[newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]]
    const reordered = newStages.map((s, i) => ({ id: s.id, order: i + 1 }))
    setError('')
    try {
      await pipelineStagesApi.reorder({ stages: reordered })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reordenar')
    }
  }

  function startEdit(stage: PipelineStage) {
    setEditingId(stage.id)
    setEditName(stage.name)
    setEditColor(stage.color)
  }

  return (
    <div className="p-5 max-w-2xl">
      <h1 className="text-base font-semibold text-slate-900 mb-5">Configurar Estágios do Pipeline</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Novo Estágio</h3>
        <form onSubmit={handleCreate} className="flex items-center gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do estágio"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-1.5 flex-wrap max-w-[180px]">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: newColor === c ? '#1e293b' : 'transparent' }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '...' : 'Criar'}
          </button>
        </form>
      </div>

      {/* Stages list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">Ordem</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estágio</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Carregando...</td></tr>
            )}
            {!loading && stages.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Nenhum estágio cadastrado.</td></tr>
            )}
            {stages.map((stage, index) => (
              <tr key={stage.id}>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-20 text-xs leading-none">▲</button>
                    <button onClick={() => handleMove(index, 'down')} disabled={index === stages.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingId === stage.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className="w-4 h-4 rounded-full border-2"
                            style={{ backgroundColor: c, borderColor: editColor === c ? '#1e293b' : 'transparent' }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-medium text-slate-900">{stage.name}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === stage.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleUpdate(stage.id)} className="text-xs text-indigo-600 hover:underline font-medium">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 hover:underline">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(stage)} className="text-xs text-slate-500 hover:text-slate-900">✏️ Editar</button>
                      <button onClick={() => handleDelete(stage.id, stage.name)} className="text-xs text-red-400 hover:text-red-600">🗑️</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
