export interface ApiError {
  response?: {
    status?: number;
    data?: Record<string, unknown>;
  };
  /** Axios timeout / network error code (e.g. "ECONNABORTED", "ERR_NETWORK") */
  code?: string;
  message?: string;
}

/** Narrow an unknown thrown value to ApiError. */
export function asApiError(err: unknown): ApiError {
  return err as ApiError;
}

/** Pull the first human-readable message out of a Django validation error body. */
export function getFieldError(data: Record<string, unknown>): string {
  const firstKey = Object.keys(data)[0];
  const raw = data[firstKey];
  if (Array.isArray(raw)) return String(raw[0]);
  if (typeof raw === "string") return raw;
  return "Failed to save. Please check your inputs.";
}
