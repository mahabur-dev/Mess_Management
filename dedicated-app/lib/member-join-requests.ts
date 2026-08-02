export type MemberJoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type MemberJoinReviewStatus = Exclude<MemberJoinRequestStatus, 'PENDING'>

export type MemberJoinRequestUser = {
  id: string
  name: string
  email: string
  phone?: string | null
}

export type MemberJoinRequestMess = {
  id: string
  name: string
  address?: string | null
}

export type MemberJoinRequest = {
  id: string
  requester_id: string
  mess_id: string
  status: MemberJoinRequestStatus
  review_note?: string | null
  reviewed_at?: string | null
  created_at: string
  requester: MemberJoinRequestUser
  mess: MemberJoinRequestMess
}
