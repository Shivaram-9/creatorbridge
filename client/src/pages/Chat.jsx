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
    
    try {
      let msg;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("media", selectedFile);
        formData.append("receiverId", partnerId);
        if (input.trim()) formData.append("content", input.trim());
        
        // Clear preview immediately to feel responsive
        const currentFile = selectedFile;
        const currentInput = input;
        setSelectedFile(null);
        setPreviewUrl("");
        setInput("");

        msg = await api.messages.sendMedia(formData);
        
        if (msg?.error) {
          // Restore on error
          setSelectedFile(currentFile);
          setPreviewUrl(URL.createObjectURL(currentFile));
          setInput(currentInput);
          setError(msg.error);
          return;
        }
      } else {
        const currentInput = input;
        setInput("");
        msg = await api.messages.send({ 
          receiverId: partnerId, 
          content: currentInput.trim() 
        });
        if (msg?.error) {
          setInput(currentInput);
          setError(msg.error);
          return;
        }
      }

      if (msg && msg._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom("smooth");
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

          const getMediaUrl = (url) => {
            if (!url) return null;
            if (url.startsWith("http")) {
              // Rescue existing broken onrender paths
              if (url.includes("onrender.com/uploads/chat/creatorbridge/")) {
                const publicId = url.split("uploads/chat/")[1];
                // Try to discover cloud name from user avatar or partner avatar
                const discoveryUrl = user?.avatar || partner?.avatar || "";
                if (discoveryUrl.includes("res.cloudinary.com/")) {
                  const cloudName = discoveryUrl.split("res.cloudinary.com/")[1].split("/")[0];
                  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
                }
              }
              return url;
            }
            
            // For local paths, strip any leading slash and prepend BASE_URL
            const cleanPath = url.startsWith("/") ? url.substring(1) : url;
            
            // Check for orphaned Cloudinary paths in local field
            if (cleanPath.startsWith("creatorbridge/")) {
                const discoveryUrl = user?.avatar || partner?.avatar || "";
                if (discoveryUrl.includes("res.cloudinary.com/")) {
                  const cloudName = discoveryUrl.split("res.cloudinary.com/")[1].split("/")[0];
                  return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanPath}`;
                }
            }

            const baseUrl = api.BASE_URL.endsWith("/") ? api.BASE_URL : `${api.BASE_URL}/`;
            return `${baseUrl}${cleanPath}`;
          };

          const mediaUrl = getMediaUrl(media);

          return (
            <div key={m._id || idx} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
              <div style={{ 
                maxWidth: '75%', 
                padding: '12px 16px', 
                borderRadius: '16px', 
                borderBottomLeftRadius: isMine ? '16px' : '0', 
                borderBottomRightRadius: isMine ? '0' : '16px', 
                background: isMine ? '#6366f1' : '#f1f5f9', 
                color: isMine ? 'white' : '#1e293b',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {mediaUrl && (
                  <div style={{ marginBottom: m.content ? '8px' : '0', minWidth: '200px', borderRadius: '12px', overflow: 'hidden', background: '#e2e8f0' }}>
                    {m.mediaType === "video" ? (
                      <video src={mediaUrl} controls style={{ width: '100%', maxHeight: '300px', display: 'block' }} />
                    ) : (
                      <img 
                        src={mediaUrl} 
                        alt="Shared media" 
                        style={{ width: '100%', height: 'auto', maxHeight: '400px', display: 'block', objectFit: 'contain' }} 
                        loading="lazy"
                        onError={(e) => {
                          console.error('Chat media failed to load:', mediaUrl);
                          e.target.style.display = 'none';
                          // Show a fallback text with the URL for debugging
                          const parent = e.target.parentElement;
                          if (parent && !parent.querySelector('.media-fallback')) {
                            const span = document.createElement('span');
                            span.className = 'media-fallback';
                            span.innerText = `⚠️ Load Failed: ${mediaUrl}`;
                            span.style.padding = '12px';
                            span.style.display = 'block';
                            span.style.fontSize = '10px';
                            span.style.color = '#ef4444';
                            span.style.textAlign = 'center';
                            span.style.wordBreak = 'break-all';
                            parent.appendChild(span);
                          }
                        }}
                      />
                    )}
                  </div>
                )}
                {m.content && <p style={{ fontSize: '15px', margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</p>}
                <span style={{ fontSize: '10px', marginTop: '6px', display: 'block', opacity: 0.7, textAlign: isMine ? 'right' : 'left', fontWeight: '500' }}>{time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form style={{ padding: '16px', background: 'white', borderTop: '1px solid #f1f5f9' }} onSubmit={handleSubmit}>
        {previewUrl && (
          <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
            {selectedFile?.type.startsWith("video") ? (
              <video src={previewUrl} style={{ height: '100px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            ) : (
              <img src={previewUrl} alt="Preview" style={{ height: '100px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            )}
            <button 
              type="button"
              onClick={() => { setSelectedFile(null); setPreviewUrl(""); }}
              style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}
            >
              ×
            </button>
          </div>
        )}
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
            autoComplete="off"
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
