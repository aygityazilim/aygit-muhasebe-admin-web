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

// Package types
export interface Resource {
  id: number
  key: string
  sort_order: number
  is_menu: boolean
  path: string | null
  parent_id: number | null
}

export interface ListItem {
  id: number
  name: string
  description: string | null
  slug: string | null
  metadata: Record<string, unknown> | null
  image: string | null
}

export interface Package {
  id: number
  key: string
  name: string
  description: string | null
  resources: Resource[]
}

export interface PackageCreatePayload {
  key: string
  name: string
  description?: string
  resource_ids: number[]
}

export interface PackageUpdatePayload {
  key?: string
  name?: string
  description?: string
  resource_ids?: number[]
}

export const ResourceAPI = {
  getList: () =>
    client.get<ApiResponse<ListItem[]>>('/resource/list'),
}

export const PackageAPI = {
  get: (skip: number, limit: number, search?: string) =>
    client.get<ApiResponse<PaginationResponse<Package>>>('/package', {
      params: { skip, limit, ...(search ? { search } : {}) },
    }),

  getList: () =>
    client.get<ApiResponse<ListItem[]>>('/package/list'),

  getOne: (id: number) =>
    client.get<ApiResponse<Package>>(`/package/${id}`),

  create: (payload: PackageCreatePayload) =>
    client.post<ApiResponse<Package>>('/package/', payload),

  update: (id: number, payload: PackageUpdatePayload) =>
    client.patch<ApiResponse<Package>>(`/package/${id}`, payload),

  delete: (id: number) =>
    client.delete<ApiResponse<Package>>(`/package/${id}`),
}

// Company types
export type CompanyType = 'jsc' | 'llc' | 'sp'

export interface Company {
  id: number
  full_name: string
  short_name: string
  tax_number: string
  tax_department: string
  address: string
  slug: string
  mersis_number: string | null
  type: CompanyType
  is_accounting_firm: boolean | null
  package: Package | null
  nes_username: string | null
  environment: string | null
  is_esmm_user: boolean | null
  is_emm_user: boolean | null
}

export interface CompanyCreatePayload {
  full_name: string
  short_name: string
  tax_number: string
  tax_department: string
  address: string
  mersis_number?: string
  type: CompanyType
  currency_id: number
  package_id: number
  is_accounting_firm: boolean
}

export interface CompanyUpdatePayload {
  full_name?: string
  short_name?: string
  tax_number?: string
  tax_department?: string
  address?: string
  mersis_number?: string
  type?: CompanyType
  package_id?: number
  is_accounting_firm?: boolean
  currency_id?: number
}

export const CompanyAPI = {
  get: (skip: number, limit: number, search?: string) =>
    client.get<ApiResponse<PaginationResponse<Company>>>('/company', {
      params: { skip, limit, ...(search ? { search } : {}) },
    }),

  getList: () =>
    client.get<ApiResponse<ListItem[]>>('/company/list'),

  getOne: (id: number) =>
    client.get<ApiResponse<Company>>(`/company/${id}`),

  create: (payload: CompanyCreatePayload) =>
    client.post<ApiResponse<Company>>('/company', payload),

  update: (id: number, payload: CompanyUpdatePayload) =>
    client.patch<ApiResponse<Company>>(`/company/${id}`, payload),

  delete: (id: number) =>
    client.delete<ApiResponse<Company>>(`/company/${id}`),
}

export const ContractVerificationAPI = {
  sendCode: (trackingNumber: string) =>
    client.patch<ApiResponse<null>>(`/contract-verification/${trackingNumber}/send-code`),
}

// Ticket types
export type TicketStatus = 'pending' | 'answered' | 'solved' | 'closed'
export type TicketMessageType = 'question' | 'answer'

export interface TicketMessage {
  content: string
  type: TicketMessageType
  created_at: string
}

export interface Ticket {
  uuid: string
  title: string
  status: TicketStatus
  last_message_date: string
  last_message: TicketMessage | null
  created_at: string
}

export const TicketAPI = {
  get: (skip: number, limit: number, search?: string) =>
    client.get<ApiResponse<PaginationResponse<Ticket>>>('/ticket', {
      params: { skip, limit, ...(search ? { search } : {}) },
    }),

  getOne: (uuid: string) =>
    client.get<ApiResponse<Ticket>>(`/ticket/${uuid}`),

  getMessages: (uuid: string) =>
    client.get<ApiResponse<TicketMessage[]>>(`/ticket/${uuid}/message`),

  answer: (uuid: string, content: string) =>
    client.post<ApiResponse<Ticket>>(`/ticket/${uuid}/answer`, { content }),

  updateStatus: (uuid: string, status: TicketStatus) =>
    client.patch<ApiResponse<Ticket>>(`/ticket/${uuid}/status`, null, {
      params: { status },
    }),
}