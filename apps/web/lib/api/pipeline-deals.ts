import { apiFetch } from '@/lib/api-client'
import type {
  Deal,
  CreateDealDto,
  UpdateDealDto,
  DealsGroupedByStage,
  PaginatedResponse,
} from '@crm/shared'

export const pipelineDealsApi = {
  listOpen: () =>
    apiFetch<{ data: DealsGroupedByStage[] }>('/api/pipeline/deals?status=OPEN'),
  listClosed: (status: 'WON' | 'LOST', page = 1) =>
    apiFetch<PaginatedResponse<Deal>>(`/api/pipeline/deals?status=${status}&page=${page}`),
  get: (id: string) =>
    apiFetch<{ data: Deal }>(`/api/pipeline/deals/${id}`),
  create: (dto: CreateDealDto) =>
    apiFetch<{ data: Deal }>('/api/pipeline/deals', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateDealDto) =>
    apiFetch<{ data: Deal }>(`/api/pipeline/deals/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/pipeline/deals/${id}`, { method: 'DELETE' }),
}
