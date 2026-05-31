export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'
export type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface Task {
  id: string
  title: string
  notes: string | null
  dueAt: string | null
  priority: TaskPriority
  status: TaskStatus
  recurrence: Recurrence
  recurrenceEndAt: string | null
  assigneeId: string
  assignee: { id: string; name: string }
  contactId: string | null
  contact: { id: string; name: string } | null
  companyId: string | null
  company: { id: string; name: string } | null
  dealId: string | null
  deal: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  assigneeId: string
  notes?: string
  dueAt?: string
  priority?: TaskPriority
  recurrence?: Recurrence
  recurrenceEndAt?: string
  contactId?: string
  companyId?: string
  dealId?: string
}

export type UpdateTaskDto = Partial<CreateTaskDto> & { status?: TaskStatus }
