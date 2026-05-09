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
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Loading conversation...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-6 py-4 border-b border-slate-100 flex items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button onClick={() => navigate("/messages")} className="md:hidden mr-4 text-slate-600 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <Avatar user={partner} size="sm" />
        <div className="ml-3 flex-1">
          <h2 className="font-bold text-slate-900 leading-tight">{partner?.name || partner?.username}</h2>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${socketOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {socketOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-indigo-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
          <button className="text-slate-400 hover:text-indigo-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
          <button className="text-slate-400 hover:text-indigo-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => {
          const isMine = (m.sender?._id || m.sender) === user?._id;
          const media = m.media || m.mediaUrl;
          const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

          return (
            <div key={m._id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMine ? "bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-100" : "bg-slate-100 text-slate-800 rounded-bl-none"}`}>
                {media && (
                  <div className="mb-2">
                    {m.mediaType === "video" ? (
                      <video src={media.startsWith("http") ? media : `${api.BASE_URL}${media}`} controls className="w-full max-h-64 rounded-xl" />
                    ) : (
                      <img src={media.startsWith("http") ? media : `${api.BASE_URL}${media}`} alt="" className="w-full max-h-64 object-cover rounded-xl" />
                    )}
                  </div>
                )}
                {m.content && <p className="text-[15px] leading-relaxed break-words">{m.content}</p>}
                <span className={`text-[10px] mt-1 block font-medium opacity-60 ${isMine ? "text-right" : "text-left"}`}>{time}</span>
              </div>
            </div>
          );
        })}
        {isPartnerTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {previewUrl && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md">
            {selectedFile?.type.startsWith("video") ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-white">Video</div> : <img src={previewUrl} className="w-full h-full object-cover" />}
            <button onClick={() => { setSelectedFile(null); setPreviewUrl(""); }} className="absolute top-1 right-1 bg-rose-500 text-white w-5 h-5 flex items-center justify-center rounded-full shadow-sm text-xs">✕</button>
          </div>
          <div className="flex-1">
             <p className="text-xs font-bold text-slate-700 truncate">{selectedFile?.name}</p>
             <p className="text-[10px] text-slate-400">Media ready to send</p>
          </div>
        </div>
      )}

      <form className="p-4 md:p-6 bg-white border-t border-slate-100" onSubmit={handleSubmit}>
        <div className="relative flex items-center gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors" disabled={sending}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          <input
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 py-2"
            placeholder={selectedFile ? "Add a caption..." : "Write a message..."}
            value={input}
            onChange={handleInputChange}
            disabled={sending}
          />
          <button 
            type="submit" 
            className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all ${(!input.trim() && !selectedFile) || sending ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700'}`}
            disabled={sending || (!input.trim() && !selectedFile)}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
