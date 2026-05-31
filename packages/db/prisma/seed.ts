import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@crm.dev' },
    update: {},
    create: { name: 'Admin', email: 'admin@crm.dev', passwordHash, role: 'ADMIN' },
  })

  // Tags
  const tagCliente = await prisma.tag.upsert({
    where: { name: 'Cliente' },
    update: {},
    create: { name: 'Cliente', color: '#6366f1' },
  })
  const tagProspect = await prisma.tag.upsert({
    where: { name: 'Prospect' },
    update: {},
    create: { name: 'Prospect', color: '#f59e0b' },
  })
  const tagVip = await prisma.tag.upsert({
    where: { name: 'VIP' },
    update: {},
    create: { name: 'VIP', color: '#22c55e' },
  })
  const tagParceiro = await prisma.tag.upsert({
    where: { name: 'Parceiro' },
    update: {},
    create: { name: 'Parceiro', color: '#ec4899' },
  })

  // Companies
  const techSolutions = await prisma.company.upsert({
    where: { id: 'company-tech' },
    update: {},
    create: { id: 'company-tech', name: 'Tech Solutions', website: 'techsolutions.com', phone: '(11) 3000-0001', sector: 'Tecnologia', notes: 'Cliente desde 2023' },
  })
  const globalCorp = await prisma.company.upsert({
    where: { id: 'company-global' },
    update: {},
    create: { id: 'company-global', name: 'GlobalCorp', website: 'globalcorp.io', phone: '(11) 3000-0002', sector: 'Consultoria' },
  })
  const startupXYZ = await prisma.company.upsert({
    where: { id: 'company-startup' },
    update: {},
    create: { id: 'company-startup', name: 'StartupXYZ', sector: 'Fintech' },
  })
  const megaInd = await prisma.company.upsert({
    where: { id: 'company-mega' },
    update: {},
    create: { id: 'company-mega', name: 'Mega Ind.', website: 'megaind.com.br', phone: '(11) 3000-0004', sector: 'Indústria' },
  })

  // Contacts
  const contacts = [
    { name: 'Maria Silva', email: 'maria@techsolutions.com', phone: '(11) 99001-0001', jobTitle: 'CEO', companyId: techSolutions.id, tags: [tagCliente, tagVip] },
    { name: 'Marcos Oliveira', email: 'marcos@globalcorp.io', phone: '(11) 99001-0002', jobTitle: 'Gerente', companyId: globalCorp.id, tags: [tagProspect] },
    { name: 'Marina Costa', email: 'marina@email.com', phone: '(11) 99001-0003', jobTitle: 'Diretora', companyId: undefined, tags: [tagParceiro] },
    { name: 'Carlos Mendes', email: 'carlos@techsolutions.com', phone: '(11) 99001-0004', jobTitle: 'CTO', companyId: techSolutions.id, tags: [tagCliente] },
    { name: 'Ana Paula Ramos', email: 'ana@startupxyz.com', phone: '(11) 99001-0005', jobTitle: 'Product Manager', companyId: startupXYZ.id, tags: [tagProspect, tagVip] },
    { name: 'Pedro Alves', email: 'pedro@megaind.com.br', phone: '(11) 99001-0006', jobTitle: 'Diretor Comercial', companyId: megaInd.id, tags: [tagCliente] },
    { name: 'Juliana Freitas', email: 'juliana@globalcorp.io', phone: '(11) 99001-0007', jobTitle: 'Analista', companyId: globalCorp.id, tags: [tagProspect] },
    { name: 'Roberto Lima', email: 'roberto@email.com', phone: '(11) 99001-0008', jobTitle: 'Consultor', companyId: undefined, tags: [tagParceiro] },
    { name: 'Fernanda Torres', email: 'fernanda@megaind.com.br', phone: '(11) 99001-0009', jobTitle: 'Gerente de Compras', companyId: megaInd.id, tags: [tagCliente, tagVip] },
    { name: 'Gabriel Souza', email: 'gabriel@startupxyz.com', phone: '(11) 99001-0010', jobTitle: 'Developer', companyId: startupXYZ.id, tags: [tagProspect] },
  ]

  for (const c of contacts) {
    const existing = await prisma.contact.findUnique({ where: { email: c.email } })
    if (!existing) {
      await prisma.contact.create({
        data: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          jobTitle: c.jobTitle,
          companyId: c.companyId ?? null,
          tags: { connect: c.tags.map((t) => ({ id: t.id })) },
        },
      })
    }
  }

  console.log('Seed Fase 2 completo: 4 empresas, 4 tags, 10 contatos criados.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
