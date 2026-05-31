import type { PipelineStageSummary } from './pipeline-stage'
import type { CompanySummary } from './company'

export type DealStatus = 'OPEN' | 'WON' | 'LOST'

export interface Deal {
  id: string
  title: string
  value: number | null
  probability: number | null
  expectedCloseAt: string | null
  notes: string | null
  status: DealStatus
  stageId: string
  stage: PipelineStageSummary
  contactId: string | null
  contact: { id: string; name: string } | null
  companyId: string | null
  company: CompanySummary | null
  createdAt: string
  updatedAt: string
}

export interface CreateDealDto {
  title: string
  stageId: string
  value?: number
  probability?: number
  expectedCloseAt?: string
  notes?: string
  contactId?: string
  companyId?: string
}

export type UpdateDealDto = Partial<CreateDealDto> & { status?: DealStatus }

export interface DealsGroupedByStage {
  stage: PipelineStageSummary
  deals: Deal[]
}
