import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

const DEAL_INCLUDE = {
  stage: { select: { id: true, name: true, color: true, order: true } },
  contact: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
} as const

export async function listDeals(req: Request, res: Response) {
  const { status = 'OPEN', page = '1', limit = '20' } = req.query as {
    status?: string; page?: string; limit?: string
  }

  if (!['OPEN', 'WON', 'LOST'].includes(status)) {
    res.status(400).json({ error: 'status deve ser OPEN, WON ou LOST' })
    return
  }

  try {
    if (status === 'OPEN') {
      // Retorna agrupado por estágio para o Kanban
      const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' },
        include: {
          deals: {
            where: { status: 'OPEN' },
            include: DEAL_INCLUDE,
            orderBy: { createdAt: 'desc' },
          },
        },
      })
      res.json({ data: stages.map((s) => ({ stage: { id: s.id, name: s.name, color: s.color, order: s.order, createdAt: s.createdAt, updatedAt: s.updatedAt }, deals: s.deals })) })
      return
    }

    // Retorna paginado para Histórico (WON / LOST)
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const skip = (pageNum - 1) * limitNum

    const [data, total] = await Promise.all([
      prisma.deal.findMany({
        where: { status: status as 'WON' | 'LOST' },
        include: DEAL_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.deal.count({ where: { status: status as 'WON' | 'LOST' } }),
    ])
    res.json({ data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createDeal(req: Request, res: Response) {
  const { title, stageId, value, probability, expectedCloseAt, notes, contactId, companyId } =
    req.body as {
      title?: string; stageId?: string; value?: number; probability?: number
      expectedCloseAt?: string; notes?: string; contactId?: string; companyId?: string
    }

  if (!title || !stageId) {
    res.status(400).json({ error: 'title e stageId são obrigatórios' })
    return
  }

  try {
    const deal = await prisma.deal.create({
      data: {
        title,
        stageId,
        value: value ?? null,
        probability: probability ?? null,
        expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
        notes: notes || null,
        contactId: contactId || null,
        companyId: companyId || null,
      },
      include: DEAL_INCLUDE,
    })
    res.status(201).json({ data: deal })
  } catch (e: any) {
    if (e.code === 'P2003') { res.status(400).json({ error: 'stageId, contactId ou companyId inválido' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function getDeal(req: Request, res: Response) {
  const { id } = req.params
  try {
    const deal = await prisma.deal.findUnique({ where: { id }, include: DEAL_INCLUDE })
    if (!deal) { res.status(404).json({ error: 'Negociação não encontrada' }); return }
    res.json({ data: deal })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function updateDeal(req: Request, res: Response) {
  const { id } = req.params
  const { title, stageId, value, probability, expectedCloseAt, notes, contactId, companyId, status } =
    req.body as {
      title?: string; stageId?: string; value?: number | null; probability?: number | null
      expectedCloseAt?: string | null; notes?: string | null; contactId?: string | null
      companyId?: string | null; status?: 'OPEN' | 'WON' | 'LOST'
    }

  try {
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(stageId !== undefined && { stageId }),
        ...(value !== undefined && { value: value ?? null }),
        ...(probability !== undefined && { probability: probability ?? null }),
        ...(expectedCloseAt !== undefined && { expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(contactId !== undefined && { contactId: contactId || null }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(status !== undefined && { status }),
      },
      include: DEAL_INCLUDE,
    })
    res.json({ data: deal })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Negociação não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteDeal(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.deal.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Negociação não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
