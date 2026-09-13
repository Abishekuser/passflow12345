/**
 * Centralized API Client for PassFlow
 * Seamlessly resolves VITE_API_URL and dev proxy.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '';

// Determine Base URL:
// In browser dev mode (e.g. running on localhost:5173), if RAW_API_URL points to localhost/127.0.0.1:8000,
// we use relative path so Vite's proxy forwards requests without CORS issues.
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // If running in browser and targeting local backend or Vite dev server (any port like 5173, 5174, etc.),
    // return empty string so relative requests go through Vite's dev proxy without CORS issues.
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    const isLocalBackend =
      RAW_API_URL.includes('127.0.0.1:8000') ||
      RAW_API_URL.includes('localhost:8000') ||
      !RAW_API_URL;

    if (isLocalhost && isLocalBackend) {
      return ''; // Route through Vite dev proxy on any port
    }
  }

  return RAW_API_URL.replace(/\/+$/, '');
}

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base request dispatcher
 */
export async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const headers = {
    ...options.headers,
  };

  // Add auth header if token exists and not explicitly excluded
  const token = localStorage.getItem('passflow_token');
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, add application/json header
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const fetchOptions = {
    ...options,
    headers,
    body,
  };

  try {
    const response = await fetch(url, fetchOptions);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      if (data && typeof data === 'object') {
        if (data.detail) {
          errorMessage = Array.isArray(data.detail)
            ? data.detail.map((err) => `${err.loc?.join(' -> ')}: ${err.msg}`).join(', ')
            : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (typeof data === 'string' && data.length > 0) {
        errorMessage = data;
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parse error
    throw new ApiError(
      error.message || 'Network connection error. Is the backend server running?',
      0,
      null
    );
  }
}
