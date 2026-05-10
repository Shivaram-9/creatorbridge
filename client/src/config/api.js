const rawUrl = import.meta.env.VITE_API_URL || "https://creatorbridge-tn9r.onrender.com";
export const BASE_URL = rawUrl.replace(/\/$/, "");
