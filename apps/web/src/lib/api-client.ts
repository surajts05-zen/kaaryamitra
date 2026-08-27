import axios from 'axios';

// Axios instance — all API calls go through this client
export const apiClient = axios.create({
  baseURL: import.meta.env['VITE_API_BASE_URL'] ?? '/api/v1',
  withCredentials: true, // Send HTTP-only cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach access token ─────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('km_access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Inject tenant slug from current URL path /t/{slug}/
  const match = window.location.pathname.match(/^\/t\/([^/]+)/);
  if (match?.[1]) {
    config.headers['X-Tenant-Slug'] = match[1];
  }

  return config;
});

// ── Response interceptor — auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config;
    const status = error.response?.status;

    // If 401 and not a refresh call itself — attempt token refresh
    if (status === 401 && originalRequest && !(originalRequest as { _retry?: boolean })._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      (originalRequest as { _retry?: boolean })._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{ data: { accessToken: string } }>(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true },
        );
        const newToken = response.data.data.accessToken;
        localStorage.setItem('km_access_token', newToken);

        // Retry all queued requests
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear auth and redirect to login if not already there
        localStorage.removeItem('km_access_token');
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
