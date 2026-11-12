const BASE_URL = '/api/v1';

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
  requestId?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorInfo: ApiError = data?.error || {
      code: 'HTTP_ERROR',
      message: `Permintaan gagal dengan status ${response.status}`,
      status: response.status,
    };
    throw errorInfo;
  }

  return data;
}
