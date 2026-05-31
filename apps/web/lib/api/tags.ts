import { apiFetch } from '@/lib/api-client'
import type { Tag, CreateTagDto, UpdateTagDto } from '@crm/shared'

export const tagsApi = {
  list: () =>
    apiFetch<{ data: Tag[] }>('/api/tags'),
  create: (dto: CreateTagDto) =>
    apiFetch<{ data: Tag }>('/api/tags', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateTagDto) =>
    apiFetch<{ data: Tag }>(`/api/tags/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tags/${id}`, { method: 'DELETE' }),
}
