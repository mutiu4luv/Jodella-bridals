const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5000'

type RequestOptions = Omit<RequestInit, 'headers'> & {
  token?: string | null
  headers?: HeadersInit
}

async function request<T>(path: string, options: RequestOptions = {}) {
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
    throw new Error(payload?.message || 'Request failed.')
  }

  return payload as T
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
    create: (token: string, body: Record<string, unknown>) =>
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
