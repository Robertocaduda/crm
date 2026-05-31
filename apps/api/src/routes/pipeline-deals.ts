import { Router } from 'express'
import { listDeals, createDeal, getDeal, updateDeal, deleteDeal } from '../controllers/pipeline-deals.controller'

const router = Router()

router.get('/', listDeals)
router.post('/', createDeal)
router.get('/:id', getDeal)
router.put('/:id', updateDeal)
router.delete('/:id', deleteDeal)

export default router
