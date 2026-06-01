export type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
export type TicketPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TicketCategory = 'BUG' | 'QUESTION' | 'REQUEST' | 'OTHER'

export interface TicketComment {
  id: string
  body: string
  authorId: string
  author: { id: string; name: string }
  ticketId: string
  createdAt: string
}

export interface Ticket {
  id: string
  number: number
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  resolution: string | null
  assigneeId: string | null
  assignee: { id: string; name: string } | null
  contactId: string | null
  contact: { id: string; name: string } | null
  companyId: string | null
  company: { id: string; name: string } | null
  comments: TicketComment[]
  createdAt: string
  updatedAt: string
}

export interface CreateTicketDto {
  title: string
  description?: string
  priority?: TicketPriority
  category?: TicketCategory
  assigneeId?: string
  contactId?: string
  companyId?: string
}

export type UpdateTicketDto = Partial<CreateTicketDto> & {
  status?: TicketStatus
  resolution?: string
}

export interface TicketsGroupedByStatus {
  status: TicketStatus
  tickets: Ticket[]
}
