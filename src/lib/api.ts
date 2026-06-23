const deployedApiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() || 'https://jordela-bridals-backend.vercel.app'
const fallbackApiBaseUrl = import.meta.env.VITE_API_URL_FALLBACK?.trim() || 'http://localhost:5000'

const isLocalDevelopment =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname))

const apiBaseUrls = Array.from(
  new Set([deployedApiBaseUrl, ...(isLocalDevelopment ? [fallbackApiBaseUrl] : [])].filter(Boolean)),
)

class HttpError extends Error {
  status: number
  missingFields?: string[]

  constructor(message: string, status: number, missingFields?: string[]) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.missingFields = missingFields
  }
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  token?: string | null
  headers?: HeadersInit
}

async function request<T>(path: string, options: RequestOptions = {}) {
  let lastNetworkError: Error | null = null

  for (const apiBaseUrl of apiBaseUrls) {
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(options.headers || {}),
        },
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new HttpError(payload?.message || 'Request failed.', response.status, payload?.missingFields)
      }

      return payload as T
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }

      lastNetworkError = error instanceof Error ? error : new Error('Request failed.')
    }
  }

  throw lastNetworkError || new Error('Request failed.')
}

export const api = {
  uploads: {
    idCard: (body: { dataUrl: string; fileName: string; mimeType: string }) =>
      request<{
        message: string
        data: { idCardUrl: string; idCardName: string; originalFilename: string }
      }>('/api/uploads/id-card', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ message: string; token: string; user: import('../types').SessionUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
    login: (body: { email: string; password: string }) =>
      request<{ message: string; token: string; user: import('../types').SessionUser }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
    me: (token: string) =>
      request<{ user: import('../types').SessionUser }>('/api/auth/me', {
        method: 'GET',
        token,
      }),
  },
  forms: {
    create: (body: Record<string, unknown>, token?: string | null) =>
      request<{ message: string }>('/api/forms', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
    list: (token: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()

      if (params?.page) {
        searchParams.set('page', String(params.page))
      }

      if (params?.limit) {
        searchParams.set('limit', String(params.limit))
      }

      const query = searchParams.toString()
      return request<{
        data: import('../types').FormSubmission[]
        pagination: { page: number; limit: number; total: number; hasMore: boolean }
      }>(`/api/forms${query ? `?${query}` : ''}`, {
        method: 'GET',
        token,
      })
    },
    summary: (token: string) =>
      request<{
        data: {
          total: number
          returned: number
          pending: number
          latestCreatedAt: string | null
        }
      }>('/api/forms/summary', {
        method: 'GET',
        token,
      }),
    update: (id: string, body: { materialsReturned?: boolean }, token: string) =>
      request<{ message: string; data: import('../types').FormSubmission }>(`/api/forms/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      }),
  },
}
