import type { Tag } from './tag'
import type { CompanySummary } from './company'

export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  jobTitle: string | null
  notes: string | null
  company: CompanySummary | null
  companyId: string | null
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface CreateContactDto {
  name: string
  email?: string
  phone?: string
  jobTitle?: string
  notes?: string
  companyId?: string
  tagIds?: string[]
}

export type UpdateContactDto = Partial<CreateContactDto>
