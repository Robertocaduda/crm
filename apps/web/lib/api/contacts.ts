import { apiFetch } from '@/lib/api-client'
import type { Contact, CreateContactDto, UpdateContactDto, PaginatedResponse } from '@crm/shared'

interface ContactsQuery {
  search?: string
  tagId?: string
  page?: number
  limit?: number
}

export const contactsApi = {
  list: (query?: ContactsQuery) => {
    const params = new URLSearchParams()
    if (query?.search) params.set('search', query.search)
    if (query?.tagId) params.set('tagId', query.tagId)
    if (query?.page) params.set('page', String(query.page))
    if (query?.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    return apiFetch<PaginatedResponse<Contact>>(`/api/contacts${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) =>
    apiFetch<{ data: Contact }>(`/api/contacts/${id}`),
  create: (dto: CreateContactDto) =>
    apiFetch<{ data: Contact }>('/api/contacts', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateContactDto) =>
    apiFetch<{ data: Contact }>(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/contacts/${id}`, { method: 'DELETE' }),
}
