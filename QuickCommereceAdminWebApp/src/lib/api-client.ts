const BASE_URL = import.meta.env.VITE_SERVER_PORT_ADMIN;

let accessToken: string | null = localStorage.getItem("authToken");
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Called by AuthContext on login/logout to keep the in-memory token in sync
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
};

export const getAccessToken = () => accessToken;

/**
 * Attempt to refresh the access token using the HTTP-only refresh token cookie.
 * Returns the new access token or null if refresh failed.
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/refresh-token`, {
      method: "POST",
      credentials: "include", // sends the HTTP-only cookie
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success && data.token) {
      setAccessToken(data.token);

      // Update stored user data if returned
      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      return data.token;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * A fetch wrapper that automatically attaches the auth token and
 * silently refreshes it on 401 responses before retrying the request.
 *
 * Usage: import { apiFetch } from "@/lib/api-client"
 *        const res = await apiFetch("/orders?status=ACTIVE")
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const makeRequest = (token: string | null) => {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };
    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, {
      ...options,
      headers,
      credentials: "include", // always send cookies
    });
  };

  // First attempt
  let response = await makeRequest(accessToken);

  // If 401, try to silently refresh
  if (response.status === 401) {
    // Deduplicate concurrent refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (newToken) {
      // Retry the original request with the new token
      response = await makeRequest(newToken);
    } else {
      // Refresh failed — clear auth state. The AuthContext will
      // react to the localStorage change and redirect to login.
      setAccessToken(null);
      localStorage.removeItem("authUser");

      // Dispatch a custom event so AuthContext can react
      window.dispatchEvent(new Event("auth:logout"));
    }
  }

  return response;
};
