import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket, getSocket } from "../services/socket.js";
import Avatar from "../components/Avatar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function Chat({ standalone = true }) {
  const { userId: partnerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [socketOnline, setSocketOnline] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const fetchConversation = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const [p, msgs] = await Promise.all([
        api.users.get(partnerId),
        api.messages.conversation(partnerId),
      ]);
      setPartner(p);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch {
      setError("Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchConversation();
    if (partnerId) api.messages.markAsRead(partnerId).catch(() => {});
  }, [fetchConversation, partnerId]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const syncStatus = () => setSocketOnline(socket.connected);
    syncStatus();

    socket.on("connect", syncStatus);
    socket.on("disconnect", syncStatus);
    socket.on("typing", (data) => data.senderId === partnerId && setIsPartnerTyping(true));
    socket.on("stop_typing", (data) => data.senderId === partnerId && setIsPartnerTyping(false));

    const onMessage = (msg) => {
      const sid = msg.sender?._id || msg.sender;
      const rid = msg.receiver?._id || msg.receiver;
      if ((sid === partnerId || rid === partnerId) && (sid === user?._id || rid === user?._id)) {
        setMessages(prev => {
          // Prevent duplicates by checking ID
          if (msg._id && prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setIsPartnerTyping(false);
        if (rid === user?._id) api.messages.markAsRead(partnerId).catch(() => {});
      }
    };
    socket.on("message", onMessage);

    return () => {
      socket.off("connect", syncStatus);
      socket.off("disconnect", syncStatus);
      socket.off("message", onMessage);
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [partnerId, user?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    const socket = getSocket();
    if (socket?.connected) {
      if (!typingTimeoutRef.current) socket.emit("typing", { receiverId: partnerId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { receiverId: partnerId });
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending || (!input.trim() && !selectedFile)) return;
    if (!partnerId) {
      setError("No recipient selected");
      return;
    }
    
    setSending(true);
    setError("");

    try {
      let msg;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("media", selectedFile);
        formData.append("receiverId", partnerId);
        if (input.trim()) formData.append("content", input.trim());
        msg = await api.messages.sendMedia(formData);
      } else {
        msg = await api.messages.send({ 
          receiverId: partnerId, 
          content: input.trim() 
        });
      }

      if (msg?.error) {
        setError(msg.error);
        console.error("Message error:", msg.error);
      } else if (msg && msg._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setInput("");
        setSelectedFile(null);
        setPreviewUrl("");
        scrollToBottom("smooth");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Send failed:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      const socket = getSocket();
      if (socket?.connected) socket.emit("stop_typing", { receiverId: partnerId });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading conversation...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <button onClick={() => navigate("/messages")} style={{ border: 'none', background: 'none', cursor: 'pointer', marginRight: '16px', color: '#64748b' }}>
          <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <Avatar user={partner} size="sm" />
        <div style={{ marginLeft: '12px', flex: 1 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{partner?.name || partner?.username}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: socketOnline ? '#10b981' : '#cbd5e1' }}></span>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
              {socketOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {messages.map((m, idx) => {
          if (!m) return null;
          const isMine = (m.sender?._id || m.sender) === user?._id;
          const media = m.media || m.mediaUrl;
          const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

          return (
            <div key={m._id || idx} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
              <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: isMine ? '16px' : '0', borderBottomRightRadius: isMine ? '0' : '16px', background: isMine ? '#6366f1' : '#f1f5f9', color: isMine ? 'white' : '#1e293b' }}>
                {media && (
                  <div style={{ marginBottom: '8px' }}>
                    {m.mediaType === "video" ? (
                      <video src={media.startsWith("http") ? media : `${api.BASE_URL}${media}`} controls style={{ width: '100%', maxHeight: '256px', borderRadius: '12px' }} />
                    ) : (
                      <img src={media.startsWith("http") ? media : `${api.BASE_URL}${media}`} alt="" style={{ width: '100%', maxHeight: '256px', borderRadius: '12px', objectFit: 'cover' }} />
                    )}
                  </div>
                )}
                {m.content && <p style={{ fontSize: '15px', margin: 0, wordBreak: 'break-word' }}>{m.content}</p>}
                <span style={{ fontSize: '10px', marginTop: '4px', display: 'block', opacity: 0.6, textAlign: isMine ? 'right' : 'left' }}>{time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form style={{ padding: '16px', background: 'white', borderTop: '1px solid #f1f5f9' }} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px', borderRadius: '24px' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', color: '#94a3b8' }}>
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          <input
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px', fontSize: '14px' }}
            placeholder="Write a message..."
            value={input}
            onChange={handleInputChange}
          />
          <button 
            type="submit" 
            style={{ padding: '8px 24px', borderRadius: '20px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: (!input.trim() && !selectedFile) ? 0.5 : 1 }}
            disabled={!input.trim() && !selectedFile}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
