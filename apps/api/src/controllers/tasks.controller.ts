import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true } },
  contact: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
  deal: { select: { id: true, title: true } },
} as const

function getDateRange(filter: string, userId: string) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  switch (filter) {
    case 'today':
      return { dueAt: { gte: todayStart, lte: todayEnd } }
    case 'week':
      return { dueAt: { gte: todayStart, lt: weekEnd } }
    case 'overdue':
      return { dueAt: { lt: todayStart }, status: { not: 'DONE' as const } }
    case 'mine':
      return { assigneeId: userId }
    default:
      return {}
  }
}

export async function listTasks(req: Request, res: Response) {
  const { filter, status, priority, page = '1', limit = '20' } = req.query as {
    filter?: string; status?: string; priority?: string; page?: string; limit?: string
  }
  const userId = (req as any).user?.id ?? ''

  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const skip = (pageNum - 1) * limitNum

  const where: any = {
    ...(filter ? getDateRange(filter, userId) : {}),
    ...(status && ['PENDING', 'IN_PROGRESS', 'DONE'].includes(status) && { status }),
    ...(priority && ['HIGH', 'MEDIUM', 'LOW'].includes(priority) && { priority }),
  }

  try {
    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
        skip,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ])
    res.json({ data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createTask(req: Request, res: Response) {
  const { title, assigneeId, notes, dueAt, priority, recurrence, recurrenceEndAt, contactId, companyId, dealId } =
    req.body as {
      title?: string; assigneeId?: string; notes?: string; dueAt?: string
      priority?: string; recurrence?: string; recurrenceEndAt?: string
      contactId?: string; companyId?: string; dealId?: string
    }

  if (!title || !assigneeId) {
    res.status(400).json({ error: 'title e assigneeId são obrigatórios' })
    return
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        assigneeId,
        notes: notes || null,
        dueAt: dueAt ? new Date(dueAt) : null,
        priority: (priority as any) || 'MEDIUM',
        recurrence: (recurrence as any) || 'NONE',
        recurrenceEndAt: recurrenceEndAt ? new Date(recurrenceEndAt) : null,
        contactId: contactId || null,
        companyId: companyId || null,
        dealId: dealId || null,
      },
      include: TASK_INCLUDE,
    })
    res.status(201).json({ data: task })
  } catch (e: any) {
    if (e.code === 'P2003') { res.status(400).json({ error: 'assigneeId, contactId, companyId ou dealId inválido' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function getTask(req: Request, res: Response) {
  const { id } = req.params
  try {
    const task = await prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE })
    if (!task) { res.status(404).json({ error: 'Tarefa não encontrada' }); return }
    res.json({ data: task })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

function nextDueAt(dueAt: Date | null, recurrence: string): Date | null {
  if (!dueAt) return null
  const next = new Date(dueAt)
  if (recurrence === 'DAILY') next.setDate(next.getDate() + 1)
  else if (recurrence === 'WEEKLY') next.setDate(next.getDate() + 7)
  else if (recurrence === 'MONTHLY') next.setMonth(next.getMonth() + 1)
  return next
}

export async function updateTask(req: Request, res: Response) {
  const { id } = req.params
  const { title, assigneeId, notes, dueAt, priority, status, recurrence, recurrenceEndAt, contactId, companyId, dealId } =
    req.body as {
      title?: string; assigneeId?: string; notes?: string | null; dueAt?: string | null
      priority?: string; status?: string; recurrence?: string; recurrenceEndAt?: string | null
      contactId?: string | null; companyId?: string | null; dealId?: string | null
    }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
        ...(priority !== undefined && { priority: priority as any }),
        ...(status !== undefined && { status: status as any }),
        ...(recurrence !== undefined && { recurrence: recurrence as any }),
        ...(recurrenceEndAt !== undefined && { recurrenceEndAt: recurrenceEndAt ? new Date(recurrenceEndAt) : null }),
        ...(contactId !== undefined && { contactId: contactId || null }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(dealId !== undefined && { dealId: dealId || null }),
      },
      include: TASK_INCLUDE,
    })

    // Lazy recurrence: se marcou como DONE e é recorrente, cria próxima instância
    if (status === 'DONE' && task.recurrence !== 'NONE') {
      const now = new Date()
      const endDate = task.recurrenceEndAt ? new Date(task.recurrenceEndAt) : null
      if (!endDate || endDate > now) {
        const nextDate = nextDueAt(task.dueAt ? new Date(task.dueAt) : null, task.recurrence)
        await prisma.task.create({
          data: {
            title: task.title,
            notes: task.notes,
            dueAt: nextDate,
            priority: task.priority,
            recurrence: task.recurrence,
            recurrenceEndAt: task.recurrenceEndAt,
            assigneeId: task.assigneeId,
            contactId: task.contactId,
            companyId: task.companyId,
            dealId: task.dealId,
            status: 'PENDING',
          },
        })
      }
    }

    res.json({ data: task })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Tarefa não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteTask(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.task.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Tarefa não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
