import { BASE_URL } from "../config/api.js";

const TOKEN_KEY = "Pactogram_token";

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
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const headers = { 
    ...(isGet ? {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    } : {}),
    ...options.headers 
  };
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
  let text = "";
  try {
    text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    const preview = text?.slice(0, 50) || "Empty response";
    return { error: `Server returned an invalid response: ${preview}...` };
  }

  if (!res.ok) {
    const errorField = data?.error || data?.message;
    const msg =
      typeof errorField === "string" ? errorField : errorField != null ? String(errorField) : "";
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
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
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
    const errorField = data?.error || data?.message;
    const errMsg =
      typeof errorField === "string" ? errorField : errorField != null ? String(errorField) : "";
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
    forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
    resetPassword: (token, password) => request(`/auth/reset-password/${token}`, { method: "POST", body: { password } }),
    verifyEmail: (token) => request(`/auth/verify-email/${token}`, { method: "POST" }),
    sendOtp: (email) => request("/auth/send-otp", { method: "POST", body: { email } }),
    verifyOtp: (email, otp) => request("/auth/verify-otp", { method: "POST", body: { email, otp } }),
    socialLogin: (body) => request("/auth/social-login", { method: "POST", body }),
  },
  users: {
    me: () => request("/users/me"),
    changePassword: (currentPassword, newPassword) => request("/users/change-password", { method: "POST", body: { currentPassword, newPassword } }),
    updateMe: (body) => request("/users/me", { method: "PATCH", body }),
    deleteMe: () => request("/users/me", { method: "DELETE" }),
    updateAvatar: (formData) => request("/users/me/avatar", { method: "POST", body: formData }),
    updateCover: (formData) => request("/users/me/cover", { method: "POST", body: formData }),
    list: (params = {}) => {
      // Backwards compatibility if a string is passed directly
      if (typeof params === 'string') {
        params = { category: params };
      }
      const sp = new URLSearchParams();
      if (params.category) sp.append("category", params.category);
      if (params.city) sp.append("city", params.city);
      if (params.role) sp.append("role", params.role);
      if (params.verified) sp.append("verified", params.verified);
      
      const q = sp.toString() ? `?${sp.toString()}` : "";
      return request(`/users${q}`);
    },
    search: (q, params = {}) => {
      const sp = new URLSearchParams({ q: q || "" });
      if (params.role) sp.append("role", params.role);
      if (params.verified) sp.append("verified", params.verified);
      if (params.category) sp.append("category", params.category);
      
      const options = {};
      if (params.signal) options.signal = params.signal;
      
      return request(`/users/search?${sp.toString()}`, options);
    },
    get: (id) => request(`/users/${id}`),
    follow: (id) => request(`/users/follow/${id}`, { method: "POST" }),
    unfollow: (id) => request(`/users/unfollow/${id}`, { method: "POST" }),
    verify: (id) => request(`/users/verify/${id}`, { method: "PATCH" }),
    saved: () => request("/users/saved"),
    collections: () => request("/users/collections"),
    createCollection: (name) => request("/users/collections", { method: "POST", body: { name } }),
    addToCollection: (colId, postId) => request(`/users/collections/${colId}/add`, { method: "POST", body: { postId } }),
    removeFromCollection: (colId, postId) => request(`/users/collections/${colId}/remove`, { method: "DELETE", body: { postId } }),
    getFollowers: (id) => request(`/users/${id}/followers`),
    getFollowing: (id) => request(`/users/${id}/following`),
    getTrending: () => request("/users/discover/trending"),
    getVerified: () => request("/users/discover/verified"),
    getBrands: () => request("/users/discover/brands"),
    getSuggested: () => request("/users/discover/suggested"),
    uploadPortfolioMedia: (formData) => request("/users/me/portfolio/upload", { method: "POST", body: formData }),
    addPortfolioItem: (body) => request("/users/me/portfolio", { method: "POST", body }),
    removePortfolioItem: (itemId) => request(`/users/me/portfolio/${itemId}`, { method: "DELETE" }),
    updatePortfolioDetails: (portfolioDetails) => request("/users/portfolio-details", { method: "PUT", body: { portfolioDetails } }),
    support: (body) => request("/users/support", { method: "POST", body }),
    rate: (id, rating) => request(`/users/${id}/rate`, { method: "POST", body: { rating } }),
  },
  discovery: {
    getSuggested: () => request("/discovery/suggested"),
    getTrending: () => request("/discovery/trending"),
    search: (q, options = {}) => {
      const type = typeof options === 'string' ? options : options.type;
      const signal = options.signal;
      return request(`/discovery/search?q=${encodeURIComponent(q || "")}${type ? `&type=${type}` : ""}`, { signal });
    },
    trackView: (targetId, category) => request("/discovery/track-view", { method: "POST", body: { targetId, category } }),
  },
  privacy: {
    getSettings: () => request("/privacy/settings"),
    updateSettings: (body) => request("/privacy/settings", { method: "PATCH", body }),
    getRequests: () => request("/privacy/requests"),
    respondRequest: (id, action) => request(`/privacy/requests/${id}/${action}`, { method: "POST" }),
  },
  security: {
    getSessions: () => request("/security/sessions"),
    revokeSession: (id) => request(`/security/sessions/${id}`, { method: "DELETE" }),
    logoutOthers: () => request("/security/sessions", { method: "DELETE" }),
    getAlerts: () => request("/security/alerts"),
    markAlertsRead: () => request("/security/alerts/read", { method: "POST" }),
  },
  moderation: {
    report: (body) => request("/moderation/report", { method: "POST", body }),
    block: (userId) => request(`/moderation/block/${userId}`, { method: "POST" }),
    unblock: (userId) => request(`/moderation/unblock/${userId}`, { method: "POST" }),
    getBlocked: () => request("/moderation/blocked"),
  },
  onboarding: {
    complete: (body) => request("/onboarding/complete", { method: "POST", body }),
    updateStep: (step) => request("/onboarding/step", { method: "PATCH", body: { step } }),
  },
  messages: {
    list: () => request("/messages"),
    conversation: (id) => request(`/messages/conversation/${id}`),
    send: (body) => request("/messages", { method: "POST", body }),
    sendMedia: (formData) => request("/messages/media", { method: "POST", body: formData }),
    markAsRead: (partnerId) => request(`/messages/read/${partnerId}`, { method: "PATCH" }),
    updateProposalStatus: (id, payload) => request(`/messages/${id}/proposal`, { method: "PATCH", body: typeof payload === 'string' ? { status: payload } : payload }),
  },
  notifications: {
    list: () => request("/notifications"),
    markRead: (id) => request(`/notifications/read/${id}`, { method: "POST" }),
    markAllRead: () => request("/notifications/read-all", { method: "POST" }),
  },
  posts: {
    list: (params = {}) => {
      const sp = new URLSearchParams(params);
      const query = sp.toString() ? `?${sp.toString()}` : "";
      return request(`/posts/feed-alliances${query}`);
    },
    get: (postId) => request(`/posts/${postId}`),
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
    pin: (postId) => request(`/posts/pin/${postId}`, { method: "PATCH" }),
    archive: (postId) => request(`/posts/archive/${postId}`, { method: "PATCH" }),
    update: (postId, body) => request(`/posts/${postId}`, { method: "PATCH", body }),
    getLikes: (postId) => request(`/posts/${postId}/likes`),
    trackView: (postId) => request(`/analytics/view/post/${postId}`, { method: "POST" }),
  },
  search: {
    users: (q, options = {}) => request(`/search/users?q=${encodeURIComponent(q || "")}`, options),
    posts: (q, options = {}) => request(`/search/posts?q=${encodeURIComponent(q || "")}`, options),
    discover: (options = {}) => request("/search/discover", options),
  },
  stories: {
    feed: () => request("/stories/feed"),
    upload: (formData) => request("/stories", { method: "POST", body: formData }),
    view: (id) => request(`/stories/view/${id}`, { method: "POST" }),
    remove: (id) => request(`/stories/${id}`, { method: "DELETE" }),
  },
  admin: {
    getStats: () => request("/admin/stats"),
    getReports: () => request("/admin/reports"),
    resolveReport: (id, status) => request(`/admin/reports/${id}`, { method: "PATCH", body: { status } }),
    getUsers: () => request("/admin/users"),
    toggleBan: (id) => request(`/admin/ban/${id}`, { method: "PATCH" }),
    deletePost: (id) => request(`/admin/posts/${id}`, { method: "DELETE" }),
    getWithdrawals: () => request("/admin/withdrawals"),
    updateWithdrawal: (id, body) => request(`/admin/withdrawals/${id}`, { method: "PATCH", body }),
    getVerifications: () => request("/admin/verifications"),
    updateVerification: (id, body) => request(`/admin/verifications/${id}`, { method: "PATCH", body }),
  },
  verification: {
    apply: (formData) => request("/verification/apply", { method: "POST", body: formData }),
    status: () => request("/verification/status"),
  },
  brand: {
    getTargeting: (params) => {
      const sp = new URLSearchParams(params);
      return request(`/brand/targeting?${sp.toString()}`);
    },
    compare: (ids) => request("/brand/compare", { method: "POST", body: { ids } }),
    getReports: () => request("/brand/reports"),
    shortlist: (creatorId) => request("/brand/shortlist", { method: "POST", body: { creatorId } }),
  },

  analytics: {
    getProfile: () => request("/analytics/profile"),
    getPosts: () => request("/analytics/posts"),
    getCampaigns: () => request("/analytics/campaigns"),
    getInsights: () => request("/analytics/insights"),
    viewProfile: (userId) => request(`/analytics/view/profile/${userId}`, { method: "POST" }),
    viewPost: (postId) => request(`/analytics/view/post/${postId}`, { method: "POST" }),
  },
  campaigns: {
    list: () => request("/campaigns"),
    get: (id) => request(`/campaigns/${id}`),
    create: (body) => request("/campaigns/create", { method: "POST", body }),
    remove: (id) => request(`/campaigns/${id}`, { method: "DELETE" }),
    apply: (id) => request(`/campaigns/apply/${id}`, { method: "POST" }),
    invite: (campaignId, userId) => request(`/campaigns/invite/${campaignId}/${userId}`, { method: "POST" }),
    respond: (campaignId, body) => request(`/campaigns/respond/${campaignId}`, { method: "POST", body }),
  },
  collaborations: {
    list: () => request("/collaborations"),
    updateStatus: (id, status) => request(`/collaborations/status/${id}`, { method: "PATCH", body: { status } }),
  },
  transactions: {
    list: () => request("/premium/transactions"), // Unified for now or new endpoint
    earnings: () => request("/premium/stats"), // Reuse existing or update
  },
  premium: {
    getStats: () => request("/premium/stats"),
    getTransactions: () => request("/premium/transactions"),
    upgrade: (tier, transactionId) => request("/premium/upgrade", { method: "POST", body: { tier, transactionId } }),
    addEarnings: (amount, description) => request("/premium/add-earnings", { method: "POST", body: { amount, description } }),
    createOrder: (tier) => request("/premium/create-order", { method: "POST", body: { tier } }),
    verifyPayment: (body) => request("/premium/verify-payment", { method: "POST", body }),
    createVerificationOrder: () => request("/premium/create-verification-order", { method: "POST" }),
    confirmVerificationPayment: (body) => request("/premium/confirm-verification", { method: "POST", body }),
    withdraw: (body) => request("/premium/withdraw", { method: "POST", body }),
  },
  ai: {
    chat: (message) => request("/ai/chat", { method: "POST", body: { message } }),
    getInsights: () => request("/ai/insights"),
  },

  BASE_URL,
  getResolvedApiOrigin: () => BASE_URL,
};
