import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, firstApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket, getSocket } from "../services/socket.js";
import { roleBadgeClass } from "../utils/badges.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

/* ── Collab message helpers ── */
const COLLAB_PREFIX = "📋 COLLABORATION PROPOSAL\n";

function isCollabMessage(content) {
  return typeof content === "string" && content.startsWith(COLLAB_PREFIX);
}

function parseCollab(content) {
  const lines = content.slice(COLLAB_PREFIX.length).split("\n");
  const data = {};
  for (const line of lines) {
    const [key, ...rest] = line.split(": ");
    if (key && rest.length) data[key.trim()] = rest.join(": ").trim();
  }
  return data;
}

function buildCollabContent({ title, budget, deliverables }) {
  return (
    COLLAB_PREFIX +
    `Campaign: ${title}\n` +
    `Budget: ${budget}\n` +
    `Deliverables: ${deliverables}`
  );
}

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

  /* Collab modal state */
  const [showCollab, setShowCollab] = useState(false);
  const [collabTitle, setCollabTitle] = useState("");
  const [collabBudget, setCollabBudget] = useState("");
  const [collabDeliverables, setCollabDeliverables] = useState("");
  const [collabSending, setCollabSending] = useState(false);

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
    async (content, onDone) => {
      try {
        const msg = await api.messages.send(receiverId, content);
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
    (content, onDone) => {
      if (!content || !receiverId) { onDone?.(); return; }

      const socket = getSocket() || connectSocket();
      const payload = { receiverId, content };

      if (socket?.connected) {
        socket.emit("send_message", payload, (ack) => {
          if (ack?.error) {
            sendContentViaRest(content, onDone);
            return;
          }
          if (ack?.message) pushMessage(ack.message);
          onDone?.();
        });
        return;
      }

      sendContentViaRest(content, onDone);
    },
    [receiverId, pushMessage, sendContentViaRest]
  );

  /* Normal message */
  function handleSubmit(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    sendContent(content, () => {
      setInput("");
      setSending(false);
    });
  }

  /* Collab proposal */
  function handleCollabSubmit(e) {
    e.preventDefault();
    const title = collabTitle.trim();
    const budget = collabBudget.trim();
    const deliverables = collabDeliverables.trim();
    if (!title || !budget || !deliverables) return;

    setCollabSending(true);
    setError("");
    const content = buildCollabContent({ title, budget, deliverables });
    sendContent(content, () => {
      setCollabSending(false);
      setShowCollab(false);
      setCollabTitle("");
      setCollabBudget("");
      setCollabDeliverables("");
    });
  }

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
            <Link to="/connections" className="btn btn-secondary btn-sm">Back to connections</Link>
            <Link to="/discover" className="btn btn-primary btn-sm">Explore</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container chat-page">
      <header className="chat-header-bar" style={{ marginBottom: 0 }}>
        <Link to="/connections" className="btn btn-secondary btn-sm">← Back</Link>
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
                Send a message below or tap 🤝 to send a collaboration proposal.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const sid = m.sender?._id || m.sender;
              const mine = sid === user?._id;
              const collab = isCollabMessage(m.content);

              if (collab) {
                const data = parseCollab(m.content);
                return (
                  <div key={m._id || m.content} className={`chat-bubble ${mine ? "chat-bubble-mine" : "chat-bubble-theirs"}`}>
                    <span className="chat-bubble__sender">{senderLabelFor(m, mine)}</span>
                    <div className="collab-card">
                      <div className="collab-card__header">
                        <span className="collab-card__icon" aria-hidden="true">🤝</span>
                        <span className="collab-card__label">Collaboration Proposal</span>
                      </div>
                      <div className="collab-card__body">
                        <div className="collab-card__row">
                          <span className="collab-card__key">Campaign</span>
                          <span className="collab-card__val">{data.Campaign || "—"}</span>
                        </div>
                        <div className="collab-card__row">
                          <span className="collab-card__key">Budget</span>
                          <span className="collab-card__val">{data.Budget || "—"}</span>
                        </div>
                        <div className="collab-card__row">
                          <span className="collab-card__key">Deliverables</span>
                          <span className="collab-card__val">{data.Deliverables || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m._id || m.content} className={`chat-bubble ${mine ? "chat-bubble-mine" : "chat-bubble-theirs"}`}>
                  <span className="chat-bubble__sender">{senderLabelFor(m, mine)}</span>
                  <div className="chat-bubble__text">{m.content}</div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row + Collab button */}
        <form className="chat-form" onSubmit={handleSubmit}>
          <button
            type="button"
            className="chat-collab-trigger"
            onClick={() => setShowCollab(true)}
            title="Interested to Collaborate"
            aria-label="Interested to Collaborate"
          >
            🤝
          </button>
          <input
            className="input"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={5000}
            disabled={sending}
            enterKeyHint="send"
            aria-label="Message text"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !input.trim()} aria-busy={sending}>
            Send
          </button>
        </form>
      </div>

      {/* ═══════════════════════════════
          COLLAB MODAL
         ═══════════════════════════════ */}
      {showCollab && (
        <div className="collab-overlay" onClick={() => !collabSending && setShowCollab(false)}>
          <div className="collab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="collab-modal__header">
              <div className="collab-modal__header-text">
                <span className="collab-modal__header-icon" aria-hidden="true">🤝</span>
                <h2 className="collab-modal__title">Interested to Collaborate</h2>
              </div>
              <button type="button" className="collab-modal__close" onClick={() => setShowCollab(false)} aria-label="Close" disabled={collabSending}>✕</button>
            </div>
            <p className="collab-modal__desc">
              Send a collaboration proposal to <strong>{partner?.name || partner?.email}</strong>. They'll see it as a card in the chat.
            </p>
            <form onSubmit={handleCollabSubmit}>
              <div className="field">
                <label htmlFor="collab-title">Campaign title</label>
                <input
                  id="collab-title"
                  className="input"
                  value={collabTitle}
                  onChange={(e) => setCollabTitle(e.target.value)}
                  placeholder="e.g. Summer Product Launch"
                  maxLength={200}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="collab-budget">Budget</label>
                <input
                  id="collab-budget"
                  className="input"
                  value={collabBudget}
                  onChange={(e) => setCollabBudget(e.target.value)}
                  placeholder="e.g. $500 or Negotiable"
                  maxLength={100}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="collab-deliverables">Deliverables</label>
                <textarea
                  id="collab-deliverables"
                  className="input"
                  value={collabDeliverables}
                  onChange={(e) => setCollabDeliverables(e.target.value)}
                  placeholder="e.g. 2 Instagram Reels + 1 Story"
                  rows={3}
                  maxLength={500}
                  required
                />
              </div>
              <div className="collab-modal__actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCollab(false)} disabled={collabSending}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={collabSending || !collabTitle.trim() || !collabBudget.trim() || !collabDeliverables.trim()}
                >
                  {collabSending ? "Sending…" : "Send Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
