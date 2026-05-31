import { Router } from 'express'
import { listTags, createTag, updateTag, deleteTag } from '../controllers/tags.controller'

const router = Router()

router.get('/', listTags)
router.post('/', createTag)
router.put('/:id', updateTag)
router.delete('/:id', deleteTag)

export default router
