import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, firstApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket, getSocket } from "../services/socket.js";
import { roleBadgeClass } from "../utils/badges.js";
import { BASE_URL } from "../config/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Avatar from "../components/Avatar.jsx";

/* Removed collab message helpers */

/**
 * Chat page — real-time messaging with REST fallback.
 */
export default function Chat() {
  const { userId: partnerId } = useParams();
  const { user } = useAuth();
  const receiverId = partnerId;

  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socketOnline, setSocketOnline] = useState(false);

  /* Media attachment state */
  const [showMedia, setShowMedia] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const seenIdsRef = useRef(new Set());
  const bottomRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const pushMessage = useCallback((msg) => {
    if (!msg) return;
    const id = msg._id;
    if (id && seenIdsRef.current.has(id)) return;
    if (id) seenIdsRef.current.add(id);

    setMessages((prev) => {
      if (id && prev.some((m) => m._id === id)) return prev;
      const next = [...prev, msg];
      next.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return ta - tb;
      });
      return next;
    });
  }, []);

  const setMessagesBulk = useCallback((msgs) => {
    const arr = Array.isArray(msgs) ? msgs : [];
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m._id, m]));
      for (const m of arr) {
        if (m._id) map.set(m._id, m);
      }
      const merged = Array.from(map.values());
      seenIdsRef.current = new Set(merged.map((m) => m._id));
      merged.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return ta - tb;
      });
      return merged;
    });
  }, []);

  const fetchConversation = useCallback(async () => {
    try {
      const [p, msgs] = await Promise.all([
        api.users.get(partnerId),
        api.messages.conversation(partnerId),
      ]);
      const errMsg = firstApiError(p, msgs);
      if (errMsg) {
        setError(errMsg);
      } else {
        setPartner(p);
        setMessagesBulk(msgs);
      }
    } catch {
      setError("Something went wrong");
    }
  }, [partnerId, setMessagesBulk]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      setLoading(true);
      await fetchConversation();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchConversation]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) {
      setSocketOnline(false);
      return undefined;
    }

    const syncOnline = () => setSocketOnline(socket.connected);
    syncOnline();

    const handleConnect = () => {
      syncOnline();
      fetchConversation();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", syncOnline);
    socket.on("connect_error", syncOnline);

    const onReconnect = () => { syncOnline(); fetchConversation(); };
    socket.io.on("reconnect", onReconnect);

    function onMessage(msg) {
      if (!msg) return;
      const sid = msg.sender?._id || msg.sender;
      const rid = msg.receiver?._id || msg.receiver;
      const pid = partnerId;
      const uid = user?._id;
      const involves = (sid === pid || rid === pid) && (sid === uid || rid === uid);
      if (!involves) return;
      pushMessage(msg);
    }

    socket.on("message", onMessage);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!socket.connected) socket.connect();
        fetchConversation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.off("message", onMessage);
      socket.off("connect", handleConnect);
      socket.off("disconnect", syncOnline);
      socket.off("connect_error", syncOnline);
      socket.io.off("reconnect", onReconnect);
    };
  }, [partnerId, user?._id, pushMessage, fetchConversation]);

  /* ── Send helpers ── */
  const sendContentViaRest = useCallback(
    async (content, mediaUrl, mediaType, onDone) => {
      try {
        const payload = { receiverId, content, mediaUrl, mediaType };
        const msg = await api.messages.send(payload);
        if (msg?.error) {
          setError(typeof msg.error === "string" ? msg.error : "Something went wrong");
        } else {
          pushMessage(msg);
        }
      } catch {
        setError("Something went wrong");
      } finally {
        onDone?.();
      }
    },
    [receiverId, pushMessage]
  );

  const sendContent = useCallback(
    (content, mediaUrl, mediaType, onDone) => {
      if ((!content && !mediaUrl) || !receiverId) { onDone?.(); return; }

      const socket = getSocket() || connectSocket();
      const payload = { receiverId, content, mediaUrl, mediaType };

      if (socket?.connected) {
        socket.emit("send_message", payload, (ack) => {
          if (ack?.error) {
            sendContentViaRest(content, mediaUrl, mediaType, onDone);
            return;
          }
          if (ack?.message) pushMessage(ack.message);
          onDone?.();
        });
        return;
      }

      sendContentViaRest(content, mediaUrl, mediaType, onDone);
    },
    [receiverId, pushMessage, sendContentViaRest]
  );

  /* Normal message */
  function handleSubmit(e) {
    e.preventDefault();
    const txt = input.trim();
    if (sending) return;
    
    if (selectedFile) {
      handleMediaUpload(e);
      return;
    }

    if (!txt) return;
    
    setSending(true);
    setError("");
    sendContent(txt, null, null, () => {
      setInput("");
      setSending(false);
    });
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Only images and videos are allowed");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowMedia(true);
  };

  const handleMediaUpload = async (e) => {
    e?.preventDefault();
    if (!selectedFile || sending) return;

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("media", selectedFile);
      formData.append("receiverId", receiverId);
      if (input.trim()) {
        formData.append("content", input.trim());
      }

      const res = await api.messages.sendMedia(formData);
      if (res.error) {
        setError(res.error);
      } else {
        pushMessage(res);
        setInput("");
        setSelectedFile(null);
        setPreviewUrl("");
        setShowMedia(false);
      }
    } catch (err) {
      setError("Failed to upload media");
    } finally {
      setSending(false);
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path}`;
  };

  const senderLabelFor = useCallback(
    (m, mine) => {
      if (mine) return user?.name || user?.email || "You";
      return m.sender?.name || m.sender?.email || partner?.name || partner?.email || "Partner";
    },
    [user?.name, user?.email, partner?.name, partner?.email]
  );

  /* ── Render ── */

  if (loading) {
    return (
      <div className="container chat-page">
        <p className="loading-line">Opening conversation</p>
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="container chat-page">
        <div className="empty-state empty-state--hero" style={{ marginTop: "1rem" }}>
          <div className="empty-state__illustration" aria-hidden="true">😕</div>
          <h2 className="empty-state__title">Could not open chat</h2>
          <p className="empty-state__text">{error}</p>
          <div className="empty-state__action">
            <Link to="/messages" className="btn btn-secondary btn-sm">Back to messages</Link>
            <Link to="/discover" className="btn btn-primary btn-sm">Explore</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container chat-page">
      <header className="chat-header-bar" style={{ marginBottom: 0 }}>
        <Link to="/messages" className="btn btn-secondary btn-sm">← Back</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Avatar user={partner} size="md" />
          <div>
            <div className="row" style={{ alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h1 className="page-title" style={{ fontSize: "1.35rem", margin: 0 }}>Chat</h1>
              <span className="muted" style={{ fontSize: "1rem", fontWeight: 600 }}>
                · {partner?.name || partner?.email || "Conversation"}
              </span>
            </div>
            <div className="row" style={{ alignItems: "center", gap: "0.65rem", marginTop: "0.35rem" }}>
              {partner?.role && <span className={`badge ${roleBadgeClass(partner.role)}`}>{partner.role}</span>}
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                {partner?.category ? <>Category · {partner.category}</> : <span>Category not set</span>}
              </p>
            </div>
          </div>
        </div>
      </header>

      {!socketOnline && (
        <p className="chat-live-banner chat-live-banner--warn" role="status">
          Chat server disconnected — messages will be sent via REST fallback.
        </p>
      )}
      {socketOnline && (
        <p className="chat-live-banner chat-live-banner--ok" role="status">
          Live messaging connected.
        </p>
      )}

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="chat-window">
        <div className="chat-messages" aria-label="Messages">
          {messages.length === 0 ? (
            <div className="chat-empty" role="status">
              <div className="chat-empty__illustration" aria-hidden="true">💬</div>
              <p className="chat-empty__title">Start the conversation</p>
              <p className="chat-empty__text">
                Send a message below or tap 📎 to send media.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const sid = m.sender?._id || m.sender;
              const mine = sid === user?._id;
              const media = m.media || m.mediaUrl;

              return (
                <div key={m._id || idx} className={`chat-bubble ${mine ? "chat-bubble-mine" : "chat-bubble-theirs"}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <Avatar user={mine ? user : m.sender || partner} size="xs" />
                    <span className="chat-bubble__sender" style={{ marginBottom: 0 }}>{senderLabelFor(m, mine)}</span>
                  </div>
                  {media && (
                    <div className="chat-media-container" style={{ marginTop: '0.25rem' }}>
                      {m.mediaType === "video" ? (
                        <video 
                          src={getMediaUrl(media)} 
                          controls 
                          className="chat-media-display" 
                          playsInline
                          style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }} 
                        />
                      ) : (
                        <img 
                          src={getMediaUrl(media)} 
                          alt="attachment" 
                          className="chat-media-display" 
                          style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }} 
                        />
                      )}
                    </div>
                  )}
                  {m.content && <div className="chat-bubble__text" style={{ marginTop: media ? '0.5rem' : 0 }}>{m.content}</div>}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row + Media button */}
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="chat-collab-trigger"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Media"
            aria-label="Attach Media"
            disabled={sending}
          >
            📎
          </button>
          <input
            className="input"
            placeholder={selectedFile ? "Add a caption…" : "Type a message…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={5000}
            disabled={sending}
            enterKeyHint="send"
            aria-label="Message text"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={sending || (!input.trim() && !selectedFile)} aria-busy={sending}>
            {sending ? "..." : (selectedFile ? "Send File" : "Send")}
          </button>
        </form>
      </div>

      {/* ═══════════════════════════════
          MEDIA MODAL
         ═══════════════════════════════ */}
      {showMedia && (
        <div className="collab-overlay" onClick={() => !sending && (setShowMedia(false), setSelectedFile(null), setPreviewUrl(""))}>
          <div className="collab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="collab-modal__header">
              <div className="collab-modal__header-text">
                <span className="collab-modal__header-icon" aria-hidden="true">🖼️</span>
                <h2 className="collab-modal__title">Media Preview</h2>
              </div>
              <button type="button" className="collab-modal__close" onClick={() => { setShowMedia(false); setSelectedFile(null); setPreviewUrl(""); }} aria-label="Close" disabled={sending}>✕</button>
            </div>
            
            <div className="media-preview-body" style={{ textAlign: 'center', padding: '1rem' }}>
              {selectedFile?.type.startsWith("video") ? (
                <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
              ) : (
                <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
              )}
              <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                {selectedFile?.name} ({(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            </div>

            <div className="collab-modal__actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setShowMedia(false); setSelectedFile(null); setPreviewUrl(""); }} 
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMediaUpload}
                disabled={sending}
              >
                {sending ? "Uploading…" : "Send Media"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
