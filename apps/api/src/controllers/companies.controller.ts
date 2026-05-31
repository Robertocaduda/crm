import type { Request, Response } from 'express'
import { prisma } from '@crm/db'

export async function listCompanies(req: Request, res: Response) {
  const { search } = req.query as { search?: string }
  try {
    const companies = await prisma.company.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ data: companies })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function createCompany(req: Request, res: Response) {
  const { name, website, phone, sector, notes } = req.body as {
    name?: string; website?: string; phone?: string; sector?: string; notes?: string
  }
  if (!name) { res.status(400).json({ error: 'name é obrigatório' }); return }
  try {
    const company = await prisma.company.create({ data: { name, website, phone, sector, notes } })
    res.status(201).json({ data: company })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function getCompany(req: Request, res: Response) {
  const { id } = req.params
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { select: { id: true, name: true, jobTitle: true } },
        _count: { select: { contacts: true } },
      },
    })
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada' }); return }
    res.json({ data: company })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function updateCompany(req: Request, res: Response) {
  const { id } = req.params
  const { name, website, phone, sector, notes } = req.body as {
    name?: string; website?: string; phone?: string; sector?: string; notes?: string
  }
  try {
    const company = await prisma.company.update({
      where: { id },
      data: { name, website, phone, sector, notes },
    })
    res.json({ data: company })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Empresa não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function deleteCompany(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.company.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Empresa não encontrada' }); return }
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
