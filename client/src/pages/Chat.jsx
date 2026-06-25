import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket, getSocket } from "../services/socket.js";
import Avatar from "../components/Avatar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { MediaIcon } from "../components/Icons.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

function SharedPostPreview({ url }) {
  const [post, setPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const match = url.match(/\/post\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      api.posts.get(match[1]).then(data => {
        if (!data.error) setPost(data);
      }).catch(() => {});
    }
  }, [url]);

  if (!post) {
    return (
      <div style={{ 
        marginTop: '8px', 
        marginBottom: '8px', 
        padding: '12px 16px', 
        background: '#fff', 
        borderRadius: '12px', 
        border: '1px solid rgba(0,0,0,0.1)', 
        width: '240px', 
        fontSize: '12px', 
        color: '#64748b' 
      }}>
        Loading preview...
      </div>
    );
  }

  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url.substring(1) : url;
    const baseUrl = api.BASE_URL.endsWith("/") ? api.BASE_URL : `${api.BASE_URL}/`;
    return `${baseUrl}${cleanPath}`;
  };

  const mediaList = post.media?.length ? post.media : (post.image ? [post.image] : []);
  const mediaUrl = mediaList[0] ? getMediaUrl(mediaList[0]) : null;

  return (
    <div 
      onClick={() => navigate(`/post/${post._id}`)}
      style={{
        marginTop: '8px',
        marginBottom: '8px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#fff',
        cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.1)',
        width: '240px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <Avatar user={post.user} size="sm" />
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{post.user?.name || post.user?.username || post.username || 'User'}</span>
      </div>
      {mediaUrl ? (
        mediaUrl.toLowerCase().split('?')[0].match(/\.(mp4|mov|webm)$/) ? (
          <video src={mediaUrl} autoPlay muted loop playsInline style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
        ) : (
          <img src={mediaUrl} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} alt="Post preview" />
        )
      ) : (
        <div style={{ padding: '12px 16px', fontSize: '13px', color: '#334155', background: '#f8fafc', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {post.content || "Shared a post"}
        </div>
      )}
    </div>
  );
}

export default function Chat({ standalone = true }) {
  const { userId: partnerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const context = useOutletContext();
  const refreshUnreadMessages = context?.refreshUnreadMessages;

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

  const handleAutoReply = async (replyText) => {
    try {
      const msg = await api.messages.send({
        receiverId: partnerId,
        content: replyText
      });
      if (msg && msg._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom("smooth");
      }
    } catch (err) {
      setError("Failed to send reply");
    }
  };

  const renderMessageContent = (text, isMine) => {
    if (text === "Would you be interested in discussing a potential collaboration?" || text.includes("Interested in Collaborating") || text.includes("Interested to Collaborate")) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid ' + (isMine ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'), paddingBottom: '8px', marginBottom: '2px' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            <span style={{ fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Collaboration Request</span>
          </div>
          <span style={{ fontSize: '14px', lineHeight: '1.5' }}>{text.replace("👉 ", "")}</span>
          {!isMine && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                onClick={() => handleAutoReply("Thank you for accepting the request. I look forward to discussing the details with you.")}
                style={{ flex: 1, padding: '8px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'opacity 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Accept
              </button>
              <button 
                onClick={() => handleAutoReply("Thank you for your time. I am unable to accept the request at this moment, but I hope we can connect in the future.")}
                style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      );
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const isPostUrl = part.includes('/post/');
        if (isPostUrl) {
          return <SharedPostPreview key={index} url={part} />;
        }
        return (
          <span key={index} style={{ display: 'inline-block', maxWidth: '100%' }}>
            <a 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: isMine ? 'white' : '#0f172a', 
                textDecoration: 'underline',
                wordBreak: 'break-all'
              }}
            >
              {part}
            </a>
          </span>
        );
      }
      return part;
    });
  };

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
    if (partnerId) {
      api.messages.markAsRead(partnerId).then(() => {
        if (refreshUnreadMessages) refreshUnreadMessages();
      }).catch(() => {});
    }
  }, [fetchConversation, partnerId, refreshUnreadMessages]);

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
        if (rid === user?._id) {
          api.messages.markAsRead(partnerId).then(() => {
            if (refreshUnreadMessages) refreshUnreadMessages();
          }).catch(() => {});
        }
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-chat, #f8fafc)' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card, rgba(255,255,255,0.72))', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <button onClick={() => navigate("/messages")} style={{ border: 'none', background: 'none', cursor: 'pointer', marginRight: '16px', color: '#64748b' }}>
          <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <Avatar user={partner} size="sm" />
        <div style={{ marginLeft: '12px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{partner?.name || partner?.username}</h2>
            {(partner?.isVerified || partner?.isPremium) && <VerifiedBadge size="sm" tier={partner.premiumTier} role={partner.role} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: socketOnline ? '#10b981' : '#cbd5e1' }}></span>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
              {socketOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        {messages.map((m, idx) => {
          if (!m) return null;
          const isMine = (m.sender?._id || m.sender) === user?._id;
          const media = m.media || m.mediaUrl;
          const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

          const getMediaUrl = (url) => {
            if (!url) return null;
            if (url.startsWith("http")) {
              // Rescue existing broken onrender paths
              if (url.includes("onrender.com/uploads/chat/Pactogram/")) {
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
            if (cleanPath.startsWith("Pactogram/")) {
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
            <div key={m._id || idx} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '12px', padding: '0 16px' }}>
              <div style={{ 
                maxWidth: '75%', 
                padding: '8px 12px 6px 12px', 
                borderRadius: '12px', 
                borderTopRightRadius: isMine ? '0' : '12px', 
                borderTopLeftRadius: isMine ? '12px' : '0', 
                background: isMine ? '#0f172a' : '#ffffff', 
                color: isMine ? '#ffffff' : '#0f172a',
                border: isMine ? 'none' : '1px solid #e2e8f0',
                boxShadow: isMine ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
                {mediaUrl && (
                  <div style={{ marginBottom: m.content ? '4px' : '0', minWidth: '200px', borderRadius: '8px', overflow: 'hidden', background: isMine ? '#334155' : '#e2e8f0' }}>
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
                          const parent = e.target.parentElement;
                          if (parent && !parent.querySelector('.media-fallback')) {
                            const span = document.createElement('span');
                            span.className = 'media-fallback';
                            span.innerText = '⚠️ Image failed to load';
                            span.style.padding = '20px';
                            span.style.display = 'block';
                            span.style.fontSize = '12px';
                            span.style.color = isMine ? '#a1a1aa' : '#64748b';
                            span.style.textAlign = 'center';
                            parent.appendChild(span);
                          }
                        }}
                      />
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '8px' }}>
                  {m.content && (
                    <p style={{ fontSize: '15px', margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap', flex: '1 1 auto', alignSelf: 'flex-start', paddingBottom: '2px', lineHeight: '1.4' }}>
                      {renderMessageContent(m.content, isMine)}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: isMine ? 0.7 : 0.6, flexShrink: 0, marginTop: m.content ? '0' : '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>{time}</span>
                    {isMine && (
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                        <path d="M11.66 4.22a.75.75 0 0 1 1.06 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 1.06-1.06l2.47 2.47 5.97-5.97z"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form style={{ padding: '16px', background: 'var(--bg-main)', borderTop: '1px solid var(--border-light)' }} onSubmit={handleSubmit}>
        {previewUrl && (
          <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
            {selectedFile?.type.startsWith("video") ? (
              <video src={previewUrl} style={{ height: '100px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
            ) : (
              <img src={previewUrl} alt="Preview" style={{ height: '100px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
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
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px' }} className="hide-scrollbar">
          <button 
            type="button" 
            onClick={() => handleAutoReply("Would you be interested in discussing a potential collaboration?")}
            style={{ 
              whiteSpace: 'nowrap', 
              padding: '6px 14px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '20px', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: 'var(--text-main)', 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Request Collaboration
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '8px', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <MediaIcon />
          </button>
          <input
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px', fontSize: '14px', color: 'var(--text-main)' }}
            placeholder="Write a message..."
            value={input}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <button 
            type="submit" 
            style={{ padding: '8px 24px', borderRadius: '20px', border: 'none', background: 'var(--primary-action)', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: (!input.trim() && !selectedFile) ? 0.5 : 1 }}
            disabled={!input.trim() && !selectedFile}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
