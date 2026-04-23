import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/proxy",
  timeout: 10000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (globalThis.window !== undefined) {
    const access = localStorage.getItem("access_token");
    if (access) config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// On 401 — try to refresh the access token once, then log out
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/login/")) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "/proxy"}/v1/auth/token/refresh/`,
          { refresh }
        );
        localStorage.setItem("access_token", data.access);
        // Keep the server-readable cookie in sync so serverFetch stays valid
        const payload = JSON.parse(atob(data.access.split(".")[1]));
        const maxAge = typeof payload.exp === "number"
          ? Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 1000))
          : 3600;
        document.cookie = `access_token=${data.access}; path=/; max-age=${maxAge}; SameSite=Lax`;
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_data");
        document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
        globalThis.window.location.href = "/login";
        return new Promise(() => {});
      }
    }
    throw error;
  }
);

export default api;
