import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "http://localhost:5000/api");

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

const cache = new Map();
const CACHE_TTL = 30000;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.method === "get") {
    const key = config.url + JSON.stringify(config.params || {});
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      config.adapter = () => Promise.resolve({ data: cached.data, status: 200, statusText: "OK", headers: {}, config });
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get") {
      const key = response.config.url + JSON.stringify(response.config.params || {});
      cache.set(key, { data: response.data, time: Date.now() });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

api.clearCache = () => cache.clear();

export default api;
