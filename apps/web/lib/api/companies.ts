import { apiFetch } from '@/lib/api-client'
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '@crm/shared'

export const companiesApi = {
  list: (search?: string) =>
    apiFetch<{ data: Company[] }>(
      `/api/companies${search ? `?search=${encodeURIComponent(search)}` : ''}`
    ),
  get: (id: string) =>
    apiFetch<{ data: Company }>(`/api/companies/${id}`),
  create: (dto: CreateCompanyDto) =>
    apiFetch<{ data: Company }>('/api/companies', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateCompanyDto) =>
    apiFetch<{ data: Company }>(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/companies/${id}`, { method: 'DELETE' }),
}
