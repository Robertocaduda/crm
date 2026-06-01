import { apiFetch } from '@/lib/api-client'
import type { MarketingList, MarketingListMember, CreateMarketingListDto, UpdateMarketingListDto, PaginatedResponse } from '@crm/shared'

export const marketingApi = {
  listLists: () =>
    apiFetch<{ data: MarketingList[] }>('/api/marketing/lists'),
  getList: (id: string) =>
    apiFetch<{ data: MarketingList }>(`/api/marketing/lists/${id}`),
  createList: (dto: CreateMarketingListDto) =>
    apiFetch<{ data: MarketingList }>('/api/marketing/lists', { method: 'POST', body: JSON.stringify(dto) }),
  updateList: (id: string, dto: UpdateMarketingListDto) =>
    apiFetch<{ data: MarketingList }>(`/api/marketing/lists/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  deleteList: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/marketing/lists/${id}`, { method: 'DELETE' }),
  listMembers: (listId: string, page = 1) =>
    apiFetch<PaginatedResponse<MarketingListMember>>(`/api/marketing/lists/${listId}/members?page=${page}&limit=20`),
  addMembers: (listId: string, contactIds: string[]) =>
    apiFetch<{ ok: boolean; added: number }>(`/api/marketing/lists/${listId}/members`, { method: 'POST', body: JSON.stringify({ contactIds }) }),
  removeMember: (listId: string, contactId: string) =>
    apiFetch<{ ok: boolean }>(`/api/marketing/lists/${listId}/members/${contactId}`, { method: 'DELETE' }),
}
