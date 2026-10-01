import axios from "axios";
import { store } from "@/app/store";
import { clearAuth } from "@/modules/auth/authSlice";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5010/api";

// `indexes: null` sends arrays as repeated keys (status=a&status=b), which is
// what Express's query parser reads; the default `status[]=` form is ignored.
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  paramsSerializer: { indexes: null },
});

http.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Routes a signed-out visitor may be on; a 401 there is not "your session ended". */
const PUBLIC_PATHS = [/^\/login/, /^\/register/, /^\/report/, /^\/p\//, /^\/track\//];

http.interceptors.response.use(
  (response) => response,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const hadToken = Boolean(store.getState().auth.accessToken);
      if (hadToken) store.dispatch(clearAuth());
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      if (hadToken && !PUBLIC_PATHS.some((rx) => rx.test(path))) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  },
);

export type ApiFieldIssue = { path?: string; message?: string };
type ApiErrorResponse = {
  error?: { code?: string; message?: string; details?: ApiFieldIssue[] | Record<string, unknown> };
};

/** The one human sentence to show for a failed request. */
export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    if (data?.error?.message) {
      const details = Array.isArray(data.error.details) ? data.error.details : [];
      if (data.error.message === "Validation error" && details[0]?.message)
        return details[0].message;
      return String(data.error.message);
    }
    if (err.code === "ECONNABORTED") return "The server took too long to respond. Try again.";
    if (!err.response) return "Can't reach Nurtail right now. Check your connection.";
    if (err.message) return err.message;
  }
  return "Something went wrong";
}

/**
 * Field-level errors from a 400, keyed by field path without the `body.`
 * prefix, for the GOV.UK-style error summary.
 */
export function getApiFieldErrors(err: unknown): Record<string, string> {
  if (!axios.isAxiosError(err)) return {};
  const details = (err.response?.data as ApiErrorResponse | undefined)?.error?.details;
  if (!Array.isArray(details)) return {};
  const out: Record<string, string> = {};
  for (const d of details) {
    if (d.path && d.message) out[d.path.replace(/^body\./, "")] = d.message;
  }
  return out;
}

export type ListMeta = {
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  page: number;
  limit: number;
};
