import type { User } from './user'

export interface LoginRequest {
  email: string
  password: string
}

export interface MeResponse {
  user: User
}

export interface AuthError {
  error: string
}
