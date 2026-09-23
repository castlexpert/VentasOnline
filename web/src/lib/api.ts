/**
 * Use relative URLs in dev (Vite proxy) so session cookies work even when the
 * site is opened via LAN IP (otherwise `localhost:3001` becomes cross-site and
 * SameSite=Lax cookies won't be sent).
 */
export const API_BASE_URL = import.meta.env.DEV
  ? ''
  : ((import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '')

export type ApiLang = 'ESPA' | 'ENGL'

export function assetUrl(p: string | null | undefined) {
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${API_BASE_URL}${p}`
}

function withCredentials(init?: RequestInit): RequestInit {
  return { ...init, credentials: 'include' as RequestCredentials }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const res = await fetch(url, withCredentials(init))
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return (await res.json()) as T
}

async function adminMultipart<T>(path: string, method: 'POST' | 'PUT', form: FormData): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const res = await fetch(url, { method, body: form, credentials: 'include' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return (await res.json()) as T
}

export type ProductCategory = {
  id_category: number
  des_category: string
  language: ApiLang
}

export type Product = {
  id_product: number
  id_category: number
  name_product: string | null
  desc_product: string | null
  det_product: string | null
  amount: string | null
  language: ApiLang
  img_path_name: string | null
  pdf_path_name: string | null
  category?: ProductCategory
}

export type Store = {
  id_store: number
  name: string
  address: string
  phone: string
  email: string
  createdAt: string
}

export type Page = { slug: string; title: string; body: unknown }

export function getPage(slug: string) {
  return request<Page>(`/api/pages/${encodeURIComponent(slug)}`)
}

export function listStores() {
  return request<Store[]>(`/api/stores`)
}

export function listProductCategories(language: ApiLang) {
  const q = new URLSearchParams({ language })
  return request<ProductCategory[]>(`/api/product-categories?${q}`)
}

export function listProducts(language: ApiLang, categoryId?: number) {
  const q = new URLSearchParams({ language })
  if (categoryId) q.set('categoryId', String(categoryId))
  return request<Product[]>(`/api/products?${q}`)
}

export function getProduct(id: number) {
  return request<Product>(`/api/products/${id}`)
}

export function authMe() {
  return request<{ user: { email: string; name: string; needsPhone?: boolean } | null }>(`/api/auth/me`)
}

export function registerUser(body: {
  email: string
  name: string
  apellido1: string
  phone: string
  apellido2?: string
  phone2?: string
  direccion?: string
}) {
  return request<{ ok: boolean }>(`/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

export function loginUser(body: { email: string; phone: string }) {
  return request<{ ok: boolean }>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

export function logoutUser() {
  return request<{ ok: boolean }>(`/api/auth/logout`, { method: 'POST' })
}

export type QuoteLine = { id_product: number; quantity: number; note?: string }

export function submitQuote(body: { id_store: number; det_quote?: string; items: QuoteLine[] }) {
  return request<{ ok: boolean; quoteIds?: number[] }>(`/api/quotes`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

export function adminLogin(user: string, password: string) {
  return request<{ ok: boolean; user: string }>(`/api/admin/login`, {
    method: 'POST',
    body: JSON.stringify({ user, password }),
    headers: { 'content-type': 'application/json' },
  })
}

export function adminMe() {
  return request<{ user: string; name?: string | null; status?: string }>(`/api/admin/me`)
}

export function adminLogout() {
  return request<{ ok: boolean }>(`/api/admin/logout`, { method: 'POST' })
}

export function adminStats() {
  return request<{ totalQuotes: number; pendingQuotes: number; activeProducts: number }>(`/api/admin/stats`)
}

export type QuotesByStoreItem = { id_store: number; storeName: string; count: number }

export function adminQuotesByStore(month: string) {
  const q = new URLSearchParams({ month })
  return request<{ month: string; items: QuotesByStoreItem[] }>(`/api/admin/stats/quotes-by-store?${q}`)
}

export type AdminQuoteRow = Record<string, unknown>

export type AdminUserRow = {
  user: string
  name: string | null
  apellido1: string | null
  apellido2: string | null
  phone: string | null
  phone2: string | null
  direccion: string | null
  ind_tip_user: string
  ind_status: string
}

export type QuoterRow = {
  email_quoter: string
  id_store: number
  name: string
  apellido1?: string | null
  apellido2?: string | null
  phone?: string | null
  phone2?: string | null
  address?: string | null
  cc_email?: string | null
  store?: Store
}

export function adminListCategories(language?: ApiLang) {
  const q = language ? `?language=${encodeURIComponent(language)}` : ''
  return request<ProductCategory[]>(`/api/admin/categories${q}`)
}

export function adminCreateCategory(body: { des_category: string; language: ApiLang }) {
  return request<ProductCategory>(`/api/admin/categories`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminUpdateCategory(id: number, body: { des_category?: string; language?: ApiLang }) {
  return request<ProductCategory>(`/api/admin/categories/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminDeleteCategory(id: number) {
  return request<{ deleted: number }>(`/api/admin/categories/${id}`, { method: 'DELETE' })
}

export function adminListProducts(params?: { language?: ApiLang; categoryId?: number }) {
  const q = new URLSearchParams()
  if (params?.language) q.set('language', params.language)
  if (params?.categoryId != null) q.set('categoryId', String(params.categoryId))
  const qs = q.toString()
  return request<Product[]>(`/api/admin/products${qs ? `?${qs}` : ''}`)
}

export function adminCreateProductFd(fd: FormData) {
  return adminMultipart<Product>(`/api/admin/products`, 'POST', fd)
}

export function adminUpdateProductFd(id: number, fd: FormData) {
  return adminMultipart<Product>(`/api/admin/products/${id}`, 'PUT', fd)
}

export function adminDeleteProduct(id: number) {
  return request<{ ok: boolean }>(`/api/admin/products/${id}`, { method: 'DELETE' })
}

export function adminListStoresPrivate() {
  return request<Store[]>(`/api/admin/stores`)
}

export function adminCreateStore(body: { name: string; address: string; phone: string; email: string }) {
  return request<Store>(`/api/admin/stores`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminUpdateStore(id: number, body: Partial<Store>) {
  return request<Store>(`/api/admin/stores/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminDeleteStore(id: number) {
  return request<{ ok: boolean }>(`/api/admin/stores/${id}`, { method: 'DELETE' })
}

export function adminListQuoters() {
  return request<QuoterRow[]>(`/api/admin/quoters`)
}

export function adminCreateQuoter(body: Partial<QuoterRow> & { email_quoter: string; id_store: number; name: string }) {
  return request<QuoterRow>(`/api/admin/quoters`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminUpdateQuoter(emailQuot: string, idStore: number, body: Partial<QuoterRow>) {
  const enc = encodeURIComponent(emailQuot)
  return request<QuoterRow>(`/api/admin/quoters/${enc}/${idStore}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminDeleteQuoter(emailQuot: string, idStore: number) {
  const enc = encodeURIComponent(emailQuot)
  return request<{ ok: boolean }>(`/api/admin/quoters/${enc}/${idStore}`, { method: 'DELETE' })
}

export function adminListQuotes(filters?: {
  status?: string
  id_store?: number
  date_from?: string
  date_to?: string
}) {
  const q = new URLSearchParams()
  if (filters?.status) q.set('status', filters.status)
  if (filters?.id_store != null) q.set('id_store', String(filters.id_store))
  if (filters?.date_from) q.set('date_from', filters.date_from)
  if (filters?.date_to) q.set('date_to', filters.date_to)
  const qs = q.toString()
  return request<AdminQuoteRow[]>(`/api/admin/quotes${qs ? `?${qs}` : ''}`)
}

export function adminQuoteDetail(user_quote: string, quote_id: number) {
  const q = new URLSearchParams({ user_quote, quote_id: String(quote_id) })
  return request<AdminQuoteRow>(`/api/admin/quotes/detail?${q}`)
}

export function adminResendQuoteEmail(body: { user_quote: string; quote_id: number }) {
  return request<{ ok: boolean }>(`/api/admin/quotes/resend-email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminPatchQuoteStatus(userQuote: string, quoteId: number, quote_status: string) {
  const encUser = encodeURIComponent(userQuote)
  return request<{ ok: boolean }>(`/api/admin/quotes/${encUser}/${quoteId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ quote_status }),
  })
}

export function adminListUsers() {
  return request<AdminUserRow[]>(`/api/admin/users`)
}

export function adminCreateUser(body: {
  user: string
  password: string
  name?: string
  apellido1?: string
  apellido2?: string
  phone?: string
  phone2?: string
  direccion?: string
}) {
  return request<{ user: string }>(`/api/admin/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function adminUserSetStatus(user: string, ind_status: 'ACTIVO' | 'INACTIVO') {
  return request<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(user)}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ind_status }),
  })
}

export function adminUserResetPassword(user: string, password: string) {
  return request<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(user)}/reset-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export function sendChatbotMessage(sessionId: string, message: string) {
  return request<{ reply: string; messageId: string }>(`/api/chatbot/message`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, message }),
    headers: { 'content-type': 'application/json' },
  })
}

export function chatbotAdvanced(body: {
  message: string
  history: { role: 'user' | 'assistant'; content: string }[]
  language?: 'es' | 'en'
  userId?: string
  cartItems?: { id_product: number; quantity: number; note?: string }[]
}) {
  return request<{
    reply: string
    language: 'es' | 'en'
    actions?: Array<
      | { type: 'add_to_cart'; id_product: number; quantity: number; note?: string | null; name_product?: string | null }
      | { type: 'select_store'; id_store: number }
      | { type: 'set_quote_details'; det_quote: string }
      | { type: 'submit_quote' }
      | { type: 'go_to_quote_page' }
    >
    // legacy (back-compat)
    action?: string | null
    payload?: { id_product: number; qty: number }
    cartItems: unknown[]
  }>(`/api/chatbot`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

export function chat(conversationId: string, language: 'es' | 'en', message: string) {
  return request<{ answer: string }>(`/api/chat`, {
    method: 'POST',
    body: JSON.stringify({ conversationId, language, message }),
    cache: 'no-store' as RequestCache,
  })
}

export function handoff(conversationId: string, language: 'es' | 'en', phone: string, transcript: string) {
  return request<{ ok: boolean; error?: string }>(`/api/handoff`, {
    method: 'POST',
    body: JSON.stringify({ conversationId, language, phone, transcript }),
    cache: 'no-store' as RequestCache,
  })
}
