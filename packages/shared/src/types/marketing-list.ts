export interface MarketingList {
  id: string
  name: string
  description: string | null
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface MarketingListMember {
  contactId: string
  contact: {
    id: string
    name: string
    email: string | null
    company: { id: string; name: string } | null
  }
  addedAt: string
}

export interface CreateMarketingListDto {
  name: string
  description?: string
}

export type UpdateMarketingListDto = Partial<CreateMarketingListDto>

export interface AddMembersDto {
  contactIds: string[]
}
