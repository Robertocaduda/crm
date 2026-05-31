import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

const CONTACT_INCLUDE = {
  company: { select: { id: true, name: true } },
  tags: { select: { id: true, name: true, color: true } },
} as const

export async function listContacts(req: Request, res: Response) {
  const { search, tagId, page = '1', limit = '20' } = req.query as {
    search?: string; tagId?: string; page?: string; limit?: string
  }

  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const skip = (pageNum - 1) * limitNum

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(tagId && { tags: { some: { id: tagId } } }),
  }

  try {
    const [data, total] = await Promise.all([
      prisma.contact.findMany({ where, include: CONTACT_INCLUDE, orderBy: { name: 'asc' }, skip, take: limitNum }),
      prisma.contact.count({ where }),
    ])
    res.json({ data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createContact(req: Request, res: Response) {
  const { name, email, phone, jobTitle, notes, companyId, tagIds = [] } = req.body as {
    name?: string; email?: string; phone?: string; jobTitle?: string
    notes?: string; companyId?: string; tagIds?: string[]
  }
  if (!name) { res.status(400).json({ error: 'name é obrigatório' }); return }
  try {
    const contact = await prisma.contact.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        jobTitle: jobTitle || null,
        notes: notes || null,
        companyId: companyId || null,
        tags: tagIds.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
      include: CONTACT_INCLUDE,
    })
    res.status(201).json({ data: contact })
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ error: 'E-mail já cadastrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function getContact(req: Request, res: Response) {
  const { id } = req.params
  try {
    const contact = await prisma.contact.findUnique({ where: { id }, include: CONTACT_INCLUDE })
    if (!contact) { res.status(404).json({ error: 'Contato não encontrado' }); return }
    res.json({ data: contact })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function updateContact(req: Request, res: Response) {
  const { id } = req.params
  const { name, email, phone, jobTitle, notes, companyId, tagIds } = req.body as {
    name?: string; email?: string; phone?: string; jobTitle?: string
    notes?: string; companyId?: string | null; tagIds?: string[]
  }
  try {
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(jobTitle !== undefined && { jobTitle: jobTitle || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(tagIds !== undefined && { tags: { set: tagIds.map((tid) => ({ id: tid })) } }),
      },
      include: CONTACT_INCLUDE,
    })
    res.json({ data: contact })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Contato não encontrado' }); return }
    if (e.code === 'P2002') { res.status(409).json({ error: 'E-mail já cadastrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteContact(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.contact.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Contato não encontrado' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
