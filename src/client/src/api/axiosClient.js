import axios from "axios";

//Environment variable automatically injected by Vite: VITE_BASE_URL
const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5050/api";

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

//Automatically append JWT
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
