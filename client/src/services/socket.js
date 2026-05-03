import { io } from "socket.io-client";
import { getToken } from "./api.js";

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  const token = getToken();
  if (!token) return null;
  if (socket?.connected) return socket;

  /* Disconnect stale socket before creating a new one */
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
    auth: { token },
    transports: ["websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
