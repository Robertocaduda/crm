import { apiFetch } from '@/lib/api-client'
import type {
  PipelineStage,
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
  ReorderStagesDto,
} from '@crm/shared'

export const pipelineStagesApi = {
  list: () =>
    apiFetch<{ data: PipelineStage[] }>('/api/pipeline/stages'),
  create: (dto: CreatePipelineStageDto) =>
    apiFetch<{ data: PipelineStage }>('/api/pipeline/stages', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdatePipelineStageDto) =>
    apiFetch<{ data: PipelineStage }>(`/api/pipeline/stages/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  reorder: (dto: ReorderStagesDto) =>
    apiFetch<{ data: PipelineStage[] }>('/api/pipeline/stages/reorder', { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/pipeline/stages/${id}`, { method: 'DELETE' }),
}
