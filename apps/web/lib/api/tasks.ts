import { apiFetch } from '@/lib/api-client'
import type { Task, CreateTaskDto, UpdateTaskDto, PaginatedResponse } from '@crm/shared'

interface TasksQuery {
  filter?: 'today' | 'week' | 'overdue' | 'mine'
  status?: string
  priority?: string
  page?: number
  limit?: number
}

export const tasksApi = {
  list: (query?: TasksQuery) => {
    const params = new URLSearchParams()
    if (query?.filter) params.set('filter', query.filter)
    if (query?.status) params.set('status', query.status)
    if (query?.priority) params.set('priority', query.priority)
    if (query?.page) params.set('page', String(query.page))
    if (query?.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    return apiFetch<PaginatedResponse<Task>>(`/api/tasks${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) =>
    apiFetch<{ data: Task }>(`/api/tasks/${id}`),
  create: (dto: CreateTaskDto) =>
    apiFetch<{ data: Task }>('/api/tasks', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateTaskDto) =>
    apiFetch<{ data: Task }>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tasks/${id}`, { method: 'DELETE' }),
}
