import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

export async function listTags(_req: Request, res: Response) {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
    res.json({ data: tags })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createTag(req: Request, res: Response) {
  const { name, color } = req.body as { name?: string; color?: string }
  if (!name || !color) {
    res.status(400).json({ error: 'name e color são obrigatórios' })
    return
  }
  try {
    const tag = await prisma.tag.create({ data: { name, color } })
    res.status(201).json({ data: tag })
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ error: 'Tag com esse nome já existe' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function updateTag(req: Request, res: Response) {
  const { id } = req.params
  const { name, color } = req.body as { name?: string; color?: string }
  try {
    const tag = await prisma.tag.update({
      where: { id },
      data: { ...(name && { name }), ...(color && { color }) },
    })
    res.json({ data: tag })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Tag não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteTag(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.tag.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Tag não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
