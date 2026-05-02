// src/utils/authManager.js

import axios from "axios";
import socket from "../socket";

const API = "https://tofo-app-production.up.railway.app";

// =========================
// Token التحكم
// =========================

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
    window.dispatchEvent(new Event("authChanged"));
  } else {
    localStorage.removeItem("accessToken");
    window.dispatchEvent(new Event("authChanged"));
  }
};

// قراءة التوكن
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

// =========================
// Axios Instance
// =========================

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// =========================
// Request Interceptor (UPDATED)
// =========================

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (!config.headers) {
    config.headers = {};
  }

  if (!token) {
    console.warn("NO TOKEN - request marked as unauthenticated");
    return config;
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// =========================
// Response Interceptor
// =========================

let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 503 && err.response?.data?.message === "OVERLOAD") {
      window.location.href = "/overload.html";
      return;
    }

    if (originalRequest._retry && err.response?.status === 401) {
      console.warn("STOPPING REFRESH LOOP");
      setAccessToken(null);
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: "Bearer " + token
              };

              resolve(api(originalRequest));
            },
            reject
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {

        const res = await api.post("/api/auth/refresh-token", {});

        const newToken = res.data.accessToken;

        if (newToken) {
          setAccessToken(newToken);
          notifySocket();
        }

        processQueue(null, newToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: "Bearer " + newToken
        };

        return api(originalRequest);

      } catch (error) {
        processQueue(error, null);
        setAccessToken(null);
        return Promise.reject(error);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// =========================
// Refresh Token (safe legacy)
// =========================

export const refreshToken = async () => {
  try {
    const res = await axios.post(
      API + "/api/auth/refresh-token",
      {},
      { withCredentials: true }
    );

    const newToken = res.data.accessToken;

    if (newToken) {
      setAccessToken(newToken);
      notifySocket();
      return newToken;
    }

    throw new Error("No token returned");

  } catch (err) {
    console.error("❌ Global Refresh Failed", err);
    setAccessToken(null);
    throw err;
  }
};

// =========================
// Wrapper
// =========================

export const apiRequest = async (config) => {
  return api(config);
};

// =========================
// Socket Sync (UPDATED)
// =========================

let reconnectTimer = null;

export const notifySocket = () => {
  try {
    socket.auth = { token: getAccessToken() };

    if (reconnectTimer) clearTimeout(reconnectTimer);

    reconnectTimer = setTimeout(() => {
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    }, 150);

  } catch (err) {
    console.log("Socket sync failed", err);
  }
};