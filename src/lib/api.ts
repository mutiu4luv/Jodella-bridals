const deployedApiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() || 'https://jordela-bridals-backend.vercel.app'
const fallbackApiBaseUrl = import.meta.env.VITE_API_URL_FALLBACK?.trim() || 'http://localhost:5000'

const apiBaseUrls = Array.from(
  new Set([deployedApiBaseUrl, fallbackApiBaseUrl].filter(Boolean)),
)

class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
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
        throw new HttpError(payload?.message || 'Request failed.', response.status)
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
    list: (token: string) =>
      request<{ data: import('../types').FormSubmission[] }>('/api/forms', {
        method: 'GET',
        token,
      }),
  },
}
