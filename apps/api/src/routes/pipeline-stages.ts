import { Router } from 'express'
import {
  listStages,
  createStage,
  updateStage,
  reorderStages,
  deleteStage,
} from '../controllers/pipeline-stages.controller'

const router = Router()

// IMPORTANTE: /reorder deve vir antes de /:id para evitar conflito de rota
router.get('/', listStages)
router.post('/', createStage)
router.put('/reorder', reorderStages)
router.put('/:id', updateStage)
router.delete('/:id', deleteStage)

export default router
