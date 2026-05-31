import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRouter from './routes/auth'
import tagsRouter from './routes/tags'
import companiesRouter from './routes/companies'
import contactsRouter from './routes/contacts'
import pipelineStagesRouter from './routes/pipeline-stages'
import pipelineDealsRouter from './routes/pipeline-deals'
import tasksRouter from './routes/tasks'
import { authenticate } from './middleware/authenticate'

const app = express()

app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/tags', authenticate, tagsRouter)
app.use('/api/companies', authenticate, companiesRouter)
app.use('/api/contacts', authenticate, contactsRouter)
app.use('/api/pipeline/stages', authenticate, pipelineStagesRouter)
app.use('/api/pipeline/deals', authenticate, pipelineDealsRouter)
app.use('/api/tasks', authenticate, tasksRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))

export default app
