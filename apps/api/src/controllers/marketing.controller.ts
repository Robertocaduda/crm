import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

export async function listLists(req: Request, res: Response) {
  try {
    const lists = await prisma.marketingList.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    })
    res.json({
      data: lists.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        memberCount: l._count.members,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
    })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createList(req: Request, res: Response) {
  const { name, description } = req.body as { name?: string; description?: string }
  if (!name) { res.status(400).json({ error: 'name é obrigatório' }); return }
  try {
    const list = await prisma.marketingList.create({
      data: { name, description: description || null },
      include: { _count: { select: { members: true } } },
    })
    res.status(201).json({
      data: { id: list.id, name: list.name, description: list.description, memberCount: list._count.members, createdAt: list.createdAt, updatedAt: list.updatedAt },
    })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function getList(req: Request, res: Response) {
  const { id } = req.params
  try {
    const list = await prisma.marketingList.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    })
    if (!list) { res.status(404).json({ error: 'Lista não encontrada' }); return }
    res.json({ data: { id: list.id, name: list.name, description: list.description, memberCount: list._count.members, createdAt: list.createdAt, updatedAt: list.updatedAt } })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function updateList(req: Request, res: Response) {
  const { id } = req.params
  const { name, description } = req.body as { name?: string; description?: string | null }
  try {
    const list = await prisma.marketingList.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
      },
      include: { _count: { select: { members: true } } },
    })
    res.json({ data: { id: list.id, name: list.name, description: list.description, memberCount: list._count.members, createdAt: list.createdAt, updatedAt: list.updatedAt } })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Lista não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteList(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.marketingList.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Lista não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

const MEMBER_INCLUDE = {
  contact: {
    select: {
      id: true,
      name: true,
      email: true,
      company: { select: { id: true, name: true } },
    },
  },
} as const

export async function listMembers(req: Request, res: Response) {
  const { id: listId } = req.params
  const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string }
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const skip = (pageNum - 1) * limitNum

  try {
    const list = await prisma.marketingList.findUnique({ where: { id: listId } })
    if (!list) { res.status(404).json({ error: 'Lista não encontrada' }); return }

    const [members, total] = await Promise.all([
      prisma.marketingListMember.findMany({
        where: { listId },
        include: MEMBER_INCLUDE,
        orderBy: { addedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.marketingListMember.count({ where: { listId } }),
    ])

    res.json({
      data: members.map((m) => ({ contactId: m.contactId, contact: m.contact, addedAt: m.addedAt })),
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function addMembers(req: Request, res: Response) {
  const { id: listId } = req.params
  const { contactIds } = req.body as { contactIds?: string[] }

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    res.status(400).json({ error: 'contactIds deve ser um array não vazio' })
    return
  }

  try {
    const list = await prisma.marketingList.findUnique({ where: { id: listId } })
    if (!list) { res.status(404).json({ error: 'Lista não encontrada' }); return }

    await prisma.marketingListMember.createMany({
      data: contactIds.map((contactId) => ({ listId, contactId })),
      skipDuplicates: true,
    })
    res.status(201).json({ ok: true, added: contactIds.length })
  } catch (e: any) {
    if (e.code === 'P2003') { res.status(400).json({ error: 'Um ou mais contactIds inválidos' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function removeMember(req: Request, res: Response) {
  const { id: listId, contactId } = req.params
  try {
    await prisma.marketingListMember.delete({ where: { listId_contactId: { listId, contactId } } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Membro não encontrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
