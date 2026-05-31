import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '@crm/db'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { setAuthCookies, clearAuthCookies } from '../lib/cookie'

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios' })
    return
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const accessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    setAuthCookies(res, accessToken, refreshToken)

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export async function logout(req: Request, res: Response) {
  const userId = res.locals.userId as string
  let dbOk = true

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
  } catch {
    dbOk = false
  }

  clearAuthCookies(res)

  if (!dbOk) {
    res.status(500).json({ error: 'Erro interno do servidor' })
    return
  }

  res.json({ ok: true })
}

export async function refresh(req: Request, res: Response) {
  const token: string | undefined = req.cookies.refresh_token
  if (!token) {
    res.status(401).json({ error: 'Sem refresh token' })
    return
  }

  try {
    const { sub } = verifyRefreshToken(token)
    const user = await prisma.user.findUnique({ where: { id: sub } })

    if (!user || user.refreshToken !== token) {
      res.status(401).json({ error: 'Refresh token inválido' })
      return
    }

    const newAccessToken = signAccessToken(user.id)
    const newRefreshToken = signRefreshToken(user.id)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    })

    setAuthCookies(res, newAccessToken, newRefreshToken)
    res.json({ ok: true })
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' })
  }
}

export async function me(req: Request, res: Response) {
  const userId = res.locals.userId as string

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    res.json({ user })
  } catch {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
