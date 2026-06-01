import { apiFetch } from '@/lib/api-client'
import type { Ticket, CreateTicketDto, UpdateTicketDto, TicketComment, TicketsGroupedByStatus, PaginatedResponse } from '@crm/shared'

export const ticketsApi = {
  listKanban: () =>
    apiFetch<{ data: TicketsGroupedByStatus[] }>('/api/tickets'),
  list: (status: string, page = 1) =>
    apiFetch<PaginatedResponse<Ticket>>(`/api/tickets?status=${status}&page=${page}`),
  get: (id: string) =>
    apiFetch<{ data: Ticket }>(`/api/tickets/${id}`),
  create: (dto: CreateTicketDto) =>
    apiFetch<{ data: Ticket }>('/api/tickets', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateTicketDto) =>
    apiFetch<{ data: Ticket }>(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tickets/${id}`, { method: 'DELETE' }),
  addComment: (ticketId: string, body: string) =>
    apiFetch<{ data: TicketComment }>(`/api/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  deleteComment: (ticketId: string, commentId: string) =>
    apiFetch<{ ok: boolean }>(`/api/tickets/${ticketId}/comments/${commentId}`, { method: 'DELETE' }),
}
