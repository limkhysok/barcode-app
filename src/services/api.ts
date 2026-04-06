import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/token/refresh/`,


          { refresh }
        );
        localStorage.setItem("access_token", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_data");
        document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
        globalThis.window.location.href = "/login";
        return new Promise(() => {});
      }
    }
    throw error;
  }
);

export default api;
