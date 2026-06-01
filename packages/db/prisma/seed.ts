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

  // Pipeline Stages
  const stageProspeccao = await prisma.pipelineStage.upsert({
    where: { id: 'stage-prospeccao' },
    update: {},
    create: { id: 'stage-prospeccao', name: 'Prospecção', order: 1, color: '#6366f1' },
  })
  const stageProposta = await prisma.pipelineStage.upsert({
    where: { id: 'stage-proposta' },
    update: {},
    create: { id: 'stage-proposta', name: 'Proposta', order: 2, color: '#f59e0b' },
  })
  const stageFechamento = await prisma.pipelineStage.upsert({
    where: { id: 'stage-fechamento' },
    update: {},
    create: { id: 'stage-fechamento', name: 'Fechamento', order: 3, color: '#22c55e' },
  })

  // Deals (vinculados a empresas do seed)
  const deals = [
    { id: 'deal-1', title: 'Contrato Tech Solutions Q3', value: 32000, probability: 75, stageId: stageProposta.id, companyId: techSolutions.id },
    { id: 'deal-2', title: 'Licença GlobalCorp Enterprise', value: 15000, probability: 40, stageId: stageProspeccao.id, companyId: globalCorp.id },
    { id: 'deal-3', title: 'Consultoria StartupXYZ', value: 8500, probability: 60, stageId: stageProspeccao.id, companyId: startupXYZ.id },
    { id: 'deal-4', title: 'Renovação Mega Ind.', value: 50000, probability: 90, stageId: stageFechamento.id, companyId: megaInd.id },
    { id: 'deal-5', title: 'Expansão Tech Solutions Q4', value: 20000, probability: 55, stageId: stageProposta.id, companyId: techSolutions.id },
  ]

  for (const d of deals) {
    await prisma.deal.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        title: d.title,
        value: d.value,
        probability: d.probability,
        stageId: d.stageId,
        companyId: d.companyId,
        status: 'OPEN',
      },
    })
  }

  // Tasks
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@crm.dev' } })
  if (adminUser) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 3)

    const tasksData = [
      {
        id: 'task-1',
        title: 'Ligar para Maria Silva',
        priority: 'HIGH' as const,
        status: 'PENDING' as const,
        recurrence: 'NONE' as const,
        dueAt: tomorrow,
        assigneeId: adminUser.id,
        contactId: (await prisma.contact.findFirst({ where: { email: 'maria@techsolutions.com' } }))?.id ?? null,
      },
      {
        id: 'task-2',
        title: 'Enviar proposta GlobalCorp',
        priority: 'HIGH' as const,
        status: 'PENDING' as const,
        recurrence: 'NONE' as const,
        dueAt: tomorrow,
        assigneeId: adminUser.id,
        dealId: 'deal-2',
      },
      {
        id: 'task-3',
        title: 'Follow-up semanal Tech Solutions',
        priority: 'MEDIUM' as const,
        status: 'PENDING' as const,
        recurrence: 'WEEKLY' as const,
        dueAt: tomorrow,
        assigneeId: adminUser.id,
        companyId: techSolutions.id,
      },
      {
        id: 'task-4',
        title: 'Atualizar dados StartupXYZ',
        priority: 'LOW' as const,
        status: 'DONE' as const,
        recurrence: 'NONE' as const,
        dueAt: lastWeek,
        assigneeId: adminUser.id,
        companyId: startupXYZ.id,
      },
      {
        id: 'task-5',
        title: 'Reunião mensal de pipeline',
        priority: 'MEDIUM' as const,
        status: 'PENDING' as const,
        recurrence: 'MONTHLY' as const,
        dueAt: tomorrow,
        assigneeId: adminUser.id,
      },
    ]

    for (const t of tasksData) {
      await prisma.task.upsert({
        where: { id: t.id },
        update: {},
        create: t,
      })
    }
  }

  // Tickets de Suporte
  const adminForTickets = await prisma.user.findUnique({ where: { email: 'admin@crm.dev' } })
  if (adminForTickets) {
    const ticket1 = await prisma.ticket.upsert({
      where: { number: 1 },
      update: {},
      create: {
        number: 1,
        title: 'Erro no módulo de pagamento',
        description: 'O sistema retorna erro 500 ao tentar processar pagamento via boleto.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        category: 'BUG',
        assigneeId: adminForTickets.id,
        companyId: techSolutions.id,
      },
    })
    await prisma.ticket.upsert({
      where: { number: 2 },
      update: {},
      create: {
        number: 2,
        title: 'Dúvida sobre fatura de março',
        description: 'Cliente questiona cobrança duplicada na fatura de março.',
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'QUESTION',
        companyId: globalCorp.id,
      },
    })
    await prisma.ticket.upsert({
      where: { number: 3 },
      update: {},
      create: {
        number: 3,
        title: 'Solicitação de novo usuário',
        description: 'Cliente solicita criação de conta para novo funcionário.',
        status: 'OPEN',
        priority: 'LOW',
        category: 'REQUEST',
        companyId: startupXYZ.id,
      },
    })
    await prisma.ticket.upsert({
      where: { number: 4 },
      update: {},
      create: {
        number: 4,
        title: 'Acesso bloqueado após atualização',
        description: 'Usuário não consegue fazer login após atualização do sistema.',
        status: 'RESOLVED',
        priority: 'HIGH',
        category: 'BUG',
        resolution: 'Senha resetada e sessão limpa. Usuário conseguiu acessar.',
        assigneeId: adminForTickets.id,
        companyId: megaInd.id,
      },
    })

    // Comentários no ticket #1
    const existingComments = await prisma.ticketComment.count({ where: { ticketId: ticket1.id } })
    if (existingComments === 0) {
      await prisma.ticketComment.createMany({
        data: [
          { body: 'Reproduzido o erro. Investigando a integração com o gateway de pagamento.', authorId: adminForTickets.id, ticketId: ticket1.id },
          { body: 'Identificado bug na versão 2.3.1 do SDK do gateway. Aguardando hotfix do fornecedor.', authorId: adminForTickets.id, ticketId: ticket1.id },
        ],
      })
    }
  }

  // Reset sequence so autoincrement starts after seeded values
  await prisma.$executeRawUnsafe(
    `SELECT setval('"Ticket_number_seq"', (SELECT MAX(number) FROM "Ticket"), true)`
  )

  console.log('Seed Fase 5 completo: 4 tickets + 2 comentários criados.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
