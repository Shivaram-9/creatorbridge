import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket, getSocket } from "../services/socket.js";
import Avatar from "../components/Avatar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function Chat() {
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
    api.messages.markAsRead(partnerId).catch(() => {});
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
        setMessages(prev => [...prev, msg]);
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
        msg = await api.messages.send({ receiverId: partnerId, content: input.trim() });
      }

      if (msg.error) setError(msg.error);
      else {
        setMessages(prev => [...prev, msg]);
        setInput("");
        setSelectedFile(null);
        setPreviewUrl("");
      }
    } catch {
      setError("Failed to send message");
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
    <div className="chat-layout-pro flex items-center justify-center">
      <div className="text-slate-400 font-medium animate-pulse">Opening DM...</div>
    </div>
  );

  return (
    <div className="chat-layout-pro slide-up">
      <header className="chat-header-pro">
        <button onClick={() => navigate("/messages")} className="mr-4 text-slate-600 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <Avatar user={partner} size="sm" />
        <div className="ml-3 flex-1 min-width-0">
          <h2 className="font-bold text-slate-900 truncate leading-tight">{partner?.name || partner?.username}</h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {socketOnline ? "Active now" : "Offline"}
          </p>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="chat-message-stream">
        {messages.map((m, idx) => {
          const isMine = (m.sender?._id || m.sender) === user?._id;
          const media = m.media || m.mediaUrl;
          const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

          return (
            <div key={m._id || idx} className={`bubble-wrap ${isMine ? "bubble-wrap-sent" : "bubble-wrap-received"}`}>
              <div className={`bubble-pro ${isMine ? "bubble-sent" : "bubble-received"}`}>
                {media && (
                  <div className="bubble-media-pro mb-2">
                    {m.mediaType === "video" ? (
                      <video src={media.startsWith("http") ? media : `${api.BASE_URL}${media}`} controls className="w-full max-h-60 rounded-xl" />
                    ) : (
                      <img src={media.startsWith("http") ? media : `${api.BASE_URL}${media}`} alt="" className="w-full max-h-60 object-cover rounded-xl" />
                    )}
                  </div>
                )}
                {m.content && <p className="leading-relaxed">{m.content}</p>}
                <span className="bubble-timestamp">{time}</span>
              </div>
            </div>
          );
        })}
        {isPartnerTyping && (
          <div className="bubble-wrap bubble-wrap-received">
            <div className="typing-pro">
              <div className="typing-dot" style={{ animationDelay: "0s" }}></div>
              <div className="typing-dot" style={{ animationDelay: "0.2s" }}></div>
              <div className="typing-dot" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {previewUrl && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
            {selectedFile?.type.startsWith("video") ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-white">Video</div> : <img src={previewUrl} className="w-full h-full object-cover" />}
            <button onClick={() => { setSelectedFile(null); setPreviewUrl(""); }} className="absolute top-0 right-0 bg-rose-500 text-white w-4 h-4 flex items-center justify-center text-[10px]">✕</button>
          </div>
          <span className="text-xs text-slate-500 truncate flex-1">{selectedFile?.name}</span>
        </div>
      )}

      <form className="chat-input-bar-pro" onSubmit={handleSubmit}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="icon-btn-pro" disabled={sending}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
        <input
          className="input-field-rounded"
          placeholder={selectedFile ? "Add a caption..." : "Message..."}
          value={input}
          onChange={handleInputChange}
          disabled={sending}
        />
        <button type="submit" className="send-btn-pro" disabled={sending || (!input.trim() && !selectedFile)}>
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
