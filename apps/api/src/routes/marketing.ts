import { Router } from 'express'
import {
  listLists, createList, getList, updateList, deleteList,
  listMembers, addMembers, removeMember,
} from '../controllers/marketing.controller'

const router = Router()

router.get('/lists', listLists)
router.post('/lists', createList)
router.get('/lists/:id', getList)
router.put('/lists/:id', updateList)
router.delete('/lists/:id', deleteList)

router.get('/lists/:id/members', listMembers)
router.post('/lists/:id/members', addMembers)
router.delete('/lists/:id/members/:contactId', removeMember)

export default router
