import { Router } from 'express'
import { listCompanies, createCompany, getCompany, updateCompany, deleteCompany } from '../controllers/companies.controller'

const router = Router()

router.get('/', listCompanies)
router.post('/', createCompany)
router.get('/:id', getCompany)
router.put('/:id', updateCompany)
router.delete('/:id', deleteCompany)

export default router
