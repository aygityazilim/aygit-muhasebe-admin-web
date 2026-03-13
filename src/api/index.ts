import client from './client'

export type RegistrationStatus = 'pending' | 'quoted' | 'done'
export type ContractType = 'kvkk' | 'etk'

export interface ContractVerification {
  id: number
  link: string
  verified_code: string | null
  verification_code: string | null
  verification_date: string | null
  type: ContractType
  sent_date: string | null
  created_at: string
}

export interface Document {
  id: number
  tax_plate: string | null
  other: string[] | null
  created_at: string
}

export interface RegistrationHistory {
  id: number
  note: string
  status: string
  created_at: string
}

export interface Registration {
  id: number
  phone: string
  message: string
  name: string | null
  surname: string | null
  tracking_number: string
  status: RegistrationStatus
  nes_info: Record<string, unknown> | null
  created_at: string
  contracts: ContractVerification[]
  document: Document | null
  history: RegistrationHistory[]
}

export interface PaginationResponse<T> {
  total_count: number
  count: number
  skip: number
  limit: number
  current_page: number
  total_pages: number
  data: T[]
}

interface ApiResponse<T> {
  status: number
  success: boolean
  error: string | null
  data: T
}

export const AuthAPI = {
  login: (email: string, password: string) =>
    client.post<ApiResponse<string>>('/auth/login', { email, password }),
}

export interface RegistrationCreatePayload {
  phone: string
  message: string
  name?: string
  surname?: string
}

export const RegistrationAPI = {
  get: (skip: number, limit: number, search?: string) =>
    client.get<ApiResponse<PaginationResponse<Registration>>>('/registiration', {
      params: { skip, limit, ...(search ? { search } : {}) },
    }),

  getOne: (trackingNumber: string) =>
    client.get<ApiResponse<Registration>>(`/registiration/${trackingNumber}`),

  create: (payload: RegistrationCreatePayload) =>
    client.post<ApiResponse<Registration>>('/registiration/', payload),

  update: (trackingNumber: string, payload: Partial<Pick<Registration, 'name' | 'surname' | 'phone' | 'status'>>) =>
    client.patch<ApiResponse<Registration>>(`/registiration/${trackingNumber}`, payload),

  delete: (trackingNumber: string) =>
    client.delete<ApiResponse<Registration>>(`/registiration/${trackingNumber}`),
}

export const ContractVerificationAPI = {
  sendCode: (trackingNumber: string, contractId: number) =>
    client.patch<ApiResponse<null>>(`/contract-verification/${trackingNumber}/send-code`, null, {
      params: { contract: contractId },
    }),
}