import { BASE_URL } from "../config/api.js";

const TOKEN_KEY = "creatorbridge_token";

/* ── Auth-failure callback (set by AuthContext) ── */
let _onAuthFailure = null;

/** Register a callback invoked on any 401 response. */
export function registerAuthFailureHandler(fn) {
  _onAuthFailure = typeof fn === "function" ? fn : null;
}

/* ── Token helpers ── */
export function getResolvedApiOrigin() {
  return BASE_URL;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/* ── Offline check ── */
function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/** If any result is `{ error: string }` from this module, returns that message. */
export function firstApiError(...results) {
  for (const r of results) {
    if (r && typeof r === "object" && !Array.isArray(r) && typeof r.error === "string") {
      return r.error;
    }
  }
  return null;
}

/* ── URL helper ── */
function urlFor(path) {
  const rest = path.replace(/^\//, "");
  return `${BASE_URL}/api/${rest}`;
}

/* ── Core request function ── */
async function request(path, options = {}) {
  if (isOffline()) {
    return { error: "No internet connection" };
  }

  const url = urlFor(path);
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      body:
        options.body && typeof options.body === "object" && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
    });
  } catch {
    return { error: "Server is unreachable right now" };
  }

  /* ── 401 → auth failure ── */
  if (res.status === 401) {
    if (_onAuthFailure) _onAuthFailure();
    return { error: "Session expired — please sign in again" };
  }

  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    return { error: "Server returned an invalid response" };
  }

  if (!res.ok) {
    const msg =
      typeof data?.error === "string" ? data.error : data?.error != null ? String(data.error) : "";
    return { error: msg || `Request failed (${res.status})` };
  }

  return data ?? {};
}

/* ── Login (special: no auth header, needs token extraction) ── */
export const login = async (body) => {
  if (isOffline()) {
    return { error: "No internet connection" };
  }

  const url = `${BASE_URL}/api/auth/login`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    return { error: "Server is unreachable right now" };
  }

  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    return { error: "Server returned an invalid response" };
  }

  if (!res.ok) {
    const errMsg =
      typeof data?.error === "string" ? data.error : data?.error != null ? String(data.error) : "";
    return { error: errMsg || "Invalid credentials" };
  }

  if (!data?.token) {
    const errMsg =
      typeof data?.error === "string" ? data.error : data?.error != null ? String(data.error) : "";
    return { error: errMsg || "Something went wrong" };
  }

  return data;
};

/* ── Public API surface ── */
export const api = {
  auth: {
    register: (body) => request("/auth/register", { method: "POST", body }),
    login: (body) => login(body),
  },
  users: {
    me: () => request("/users/me"),
    updateMe: (body) => request("/users/me", { method: "PATCH", body }),
    updateAvatar: (formData) => request("/users/me/avatar", { method: "POST", body: formData }),
    list: (category) => {
      const q = category ? `?category=${encodeURIComponent(category)}` : "";
      return request(`/users${q}`);
    },
    search: (q) => request(`/users/search?q=${encodeURIComponent(q || "")}`),
    get: (id) => request(`/users/${id}`),
    follow: (id) => request(`/users/follow/${id}`, { method: "POST" }),
    unfollow: (id) => request(`/users/unfollow/${id}`, { method: "POST" }),
    verify: (id) => request(`/users/verify/${id}`, { method: "PATCH" }),
    saved: () => request("/users/saved"),
    getFollowers: (id) => request(`/users/${id}/followers`),
    getFollowing: (id) => request(`/users/${id}/following`),
    addPortfolioItem: (body) => request("/users/me/portfolio", { method: "POST", body }),
    removePortfolioItem: (itemId) => request(`/users/me/portfolio/${itemId}`, { method: "DELETE" }),
  },
  messages: {
    list: () => request("/messages"),
    conversation: (otherUserId) => request(`/messages/conversation/${otherUserId}`),
    send: (payload) => request("/messages", { method: "POST", body: payload }),
    sendMedia: (formData) => request("/messages/media", { method: "POST", body: formData }),
  },
  notifications: {
    list: () => request("/notifications"),
    markRead: (id) => request(`/notifications/read/${id}`, { method: "POST" }),
    markAllRead: () => request("/notifications/read-all", { method: "POST" }),
  },
  posts: {
    list: () => request("/posts"),
    userPosts: (userId) => request(`/posts/user/${userId}`),
    create: (formData) => request("/posts", { 
      method: "POST", 
      body: formData 
    }),
    like: (postId) => request(`/posts/like/${postId}`, { method: "POST" }),
    comment: (postId, text) => request(`/posts/comment/${postId}`, { 
      method: "POST", 
      body: { text } 
    }),
    remove: (postId) => request(`/posts/${postId}`, { method: "DELETE" }),
    save: (postId) => request(`/posts/save/${postId}`, { method: "POST" }),
    getSaved: () => request("/posts/saved"),
  },
  search: {
    users: (q) => request(`/search/users?q=${encodeURIComponent(q)}`),
    posts: (q) => request(`/search/posts?q=${encodeURIComponent(q)}`),
    discover: () => request("/search/discover"),
  },
};
