import { Router } from 'express'
import { prisma } from '@crm/db'
import { listTasks, createTask, getTask, updateTask, deleteTask } from '../controllers/tasks.controller'

const router = Router()

// Must come before /:id to avoid route conflict
router.get('/users-list', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    res.json({ data: users })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

router.get('/', listTasks)
router.post('/', createTask)
router.get('/:id', getTask)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
