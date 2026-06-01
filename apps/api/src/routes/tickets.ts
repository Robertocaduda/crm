import { Router } from 'express'
import {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
  createComment,
  deleteComment,
} from '../controllers/tickets.controller'

const router = Router()

router.get('/', listTickets)
router.post('/', createTicket)
router.get('/:id', getTicket)
router.put('/:id', updateTicket)
router.delete('/:id', deleteTicket)

// Comments
router.post('/:id/comments', createComment)
router.delete('/:id/comments/:commentId', deleteComment)

export default router
