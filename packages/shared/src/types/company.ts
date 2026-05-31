export interface CompanySummary {
  id: string
  name: string
}

export interface Company {
  id: string
  name: string
  website: string | null
  phone: string | null
  sector: string | null
  notes: string | null
  _count?: { contacts: number }
  createdAt: string
  updatedAt: string
}

export interface CreateCompanyDto {
  name: string
  website?: string
  phone?: string
  sector?: string
  notes?: string
}

export type UpdateCompanyDto = Partial<CreateCompanyDto>
