import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

export async function listStages(_req: Request, res: Response) {
  try {
    const stages = await prisma.pipelineStage.findMany({ orderBy: { order: 'asc' } })
    res.json({ data: stages })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createStage(req: Request, res: Response) {
  const { name, color } = req.body as { name?: string; color?: string }
  if (!name || !color) {
    res.status(400).json({ error: 'name e color são obrigatórios' })
    return
  }
  try {
    const maxOrder = await prisma.pipelineStage.aggregate({ _max: { order: true } })
    const order = (maxOrder._max.order ?? 0) + 1
    const stage = await prisma.pipelineStage.create({ data: { name, color, order } })
    res.status(201).json({ data: stage })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function updateStage(req: Request, res: Response) {
  const { id } = req.params
  const { name, color } = req.body as { name?: string; color?: string }
  try {
    const stage = await prisma.pipelineStage.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(color !== undefined && { color }) },
    })
    res.json({ data: stage })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Estágio não encontrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function reorderStages(req: Request, res: Response) {
  const { stages } = req.body as { stages?: { id: string; order: number }[] }
  if (!Array.isArray(stages) || stages.length === 0) {
    res.status(400).json({ error: 'stages deve ser um array não vazio' })
    return
  }
  try {
    await prisma.$transaction(
      stages.map(({ id, order }) =>
        prisma.pipelineStage.update({ where: { id }, data: { order } })
      )
    )
    const updated = await prisma.pipelineStage.findMany({ orderBy: { order: 'asc' } })
    res.json({ data: updated })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteStage(req: Request, res: Response) {
  const { id } = req.params
  try {
    const count = await prisma.deal.count({ where: { stageId: id } })
    if (count > 0) {
      res.status(409).json({ error: `Este estágio possui ${count} deal(s) vinculado(s). Mova-os antes de excluir.` })
      return
    }
    await prisma.pipelineStage.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Estágio não encontrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
