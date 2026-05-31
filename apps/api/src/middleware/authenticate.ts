import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token: string | undefined = req.cookies.access_token
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const payload = verifyAccessToken(token)
    res.locals.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}
