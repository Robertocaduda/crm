import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

const TICKET_INCLUDE = {
  assignee: { select: { id: true, name: true } },
  contact:  { select: { id: true, name: true } },
  company:  { select: { id: true, name: true } },
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const

export async function listTickets(req: Request, res: Response) {
  const { status, priority, category, assigneeId, page = '1', limit = '20' } = req.query as {
    status?: string; priority?: string; category?: string; assigneeId?: string
    page?: string; limit?: string
  }

  const where: any = {
    ...(status && ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status) && { status }),
    ...(priority && ['HIGH', 'MEDIUM', 'LOW'].includes(priority) && { priority }),
    ...(category && ['BUG', 'QUESTION', 'REQUEST', 'OTHER'].includes(category) && { category }),
    ...(assigneeId && { assigneeId }),
  }

  try {
    if (!status) {
      // Retorna agrupado por status para o Kanban
      const tickets = await prisma.ticket.findMany({
        where,
        include: TICKET_INCLUDE,
        orderBy: { number: 'desc' },
      })

      const groups = (['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => ({
        status: s,
        tickets: tickets.filter((t) => t.status === s),
      }))

      res.json({ data: groups })
      return
    }

    // Lista paginada para filtro específico
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const skip = (pageNum - 1) * limitNum

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({ where, include: TICKET_INCLUDE, orderBy: { number: 'desc' }, skip, take: limitNum }),
      prisma.ticket.count({ where }),
    ])
    res.json({ data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createTicket(req: Request, res: Response) {
  const { title, description, priority, category, assigneeId, contactId, companyId } =
    req.body as {
      title?: string; description?: string; priority?: string; category?: string
      assigneeId?: string; contactId?: string; companyId?: string
    }

  if (!title) {
    res.status(400).json({ error: 'title é obrigatório' })
    return
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || null,
        priority: (priority as any) || 'MEDIUM',
        category: (category as any) || 'OTHER',
        assigneeId: assigneeId || null,
        contactId: contactId || null,
        companyId: companyId || null,
      },
      include: TICKET_INCLUDE,
    })
    res.status(201).json({ data: ticket })
  } catch (e: any) {
    if (e.code === 'P2003') { res.status(400).json({ error: 'assigneeId, contactId ou companyId inválido' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function getTicket(req: Request, res: Response) {
  const { id } = req.params
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE })
    if (!ticket) { res.status(404).json({ error: 'Ticket não encontrado' }); return }
    res.json({ data: ticket })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function updateTicket(req: Request, res: Response) {
  const { id } = req.params
  const { title, description, status, priority, category, resolution, assigneeId, contactId, companyId } =
    req.body as {
      title?: string; description?: string | null; status?: string; priority?: string
      category?: string; resolution?: string | null; assigneeId?: string | null
      contactId?: string | null; companyId?: string | null
    }

  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(status !== undefined && { status: status as any }),
        ...(priority !== undefined && { priority: priority as any }),
        ...(category !== undefined && { category: category as any }),
        ...(resolution !== undefined && { resolution: resolution || null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(contactId !== undefined && { contactId: contactId || null }),
        ...(companyId !== undefined && { companyId: companyId || null }),
      },
      include: TICKET_INCLUDE,
    })
    res.json({ data: ticket })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Ticket não encontrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteTicket(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.ticket.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Ticket não encontrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createComment(req: Request, res: Response) {
  const { id: ticketId } = req.params
  const { body } = req.body as { body?: string }
  const authorId = (req as any).user?.id

  if (!body) {
    res.status(400).json({ error: 'body é obrigatório' })
    return
  }
  if (!authorId) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  try {
    const comment = await prisma.ticketComment.create({
      data: { body, authorId, ticketId },
      include: { author: { select: { id: true, name: true } } },
    })
    res.status(201).json({ data: comment })
  } catch (e: any) {
    if (e.code === 'P2003') { res.status(404).json({ error: 'Ticket não encontrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteComment(req: Request, res: Response) {
  const { id: ticketId, commentId } = req.params
  const userId = (req as any).user?.id
  if (!userId) { res.status(401).json({ error: 'Não autenticado' }); return }

  try {
    const comment = await prisma.ticketComment.findUnique({ where: { id: commentId } })
    if (!comment || comment.ticketId !== ticketId) {
      res.status(404).json({ error: 'Comentário não encontrado' })
      return
    }
    const userRole = (req as any).user?.role
    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Sem permissão' })
      return
    }
    await prisma.ticketComment.delete({ where: { id: commentId } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
