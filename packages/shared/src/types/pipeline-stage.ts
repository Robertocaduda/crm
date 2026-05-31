export interface PipelineStage {
  id: string
  name: string
  order: number
  color: string
  createdAt: string
  updatedAt: string
}

export interface CreatePipelineStageDto {
  name: string
  color: string
}

export interface UpdatePipelineStageDto {
  name?: string
  color?: string
}

export interface ReorderStagesDto {
  stages: { id: string; order: number }[]
}
