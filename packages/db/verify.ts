import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  const stageCount = await prisma.pipelineStage.count()
  const dealCount = await prisma.deal.count()
  
  console.log(`\n=== VERIFICATION ===`)
  console.log(`PipelineStage count: ${stageCount}`)
  console.log(`Deal count: ${dealCount}`)
  
  console.log('\n=== STAGES ===')
  const stages = await prisma.pipelineStage.findMany({
    orderBy: { order: 'asc' }
  })
  stages.forEach(s => {
    console.log(`${s.name} (order: ${s.order}, color: ${s.color})`)
  })
  
  console.log('\n=== DEALS ===')
  const deals = await prisma.deal.findMany({
    include: { stage: true, company: true }
  })
  deals.forEach(d => {
    console.log(`${d.title} - ${d.status} - ${d.stage.name} - ${d.company?.name || 'No Company'} - Value: ${d.value}`)
  })
}

verify()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
