import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket, getSocket } from "../services/socket.js";
import Avatar from "../components/Avatar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { MediaIcon } from "../components/Icons.jsx";
import VerifiedUserDisplay from "../components/VerifiedUserDisplay.jsx";
import CollaborationProposalModal from "../components/CollaborationProposalModal.jsx";
import { toast } from "react-hot-toast";

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
        background: 'var(--bg-card)', 
        borderRadius: '12px', 
        border: '1px solid rgba(0,0,0,0.1)', 
        width: '240px', 
        fontSize: '12px', 
        color: 'var(--text-muted)' 
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
        background: 'var(--bg-card)',
        cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.1)',
        width: '240px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <Avatar user={post.user} size="sm" />
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{post.user?.name || post.user?.username || post.username || 'User'}</span>
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
  const [showProposalModal, setShowProposalModal] = useState(false);

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

  const handleSendProposal = async (proposalData) => {
    setShowProposalModal(false);
    try {
      const contentString = JSON.stringify(proposalData);
      const msg = await api.messages.send({
        receiverId: partnerId,
        content: contentString,
      });
      if (msg && msg._id) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom("smooth");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send proposal");
    }
  };

  const handleAcceptProposal = async (msgId) => {
    try {
      await api.messages.updateProposalStatus(msgId, "Accepted");
      setMessages(prev => prev.map(m => {
        if (m._id === msgId) {
          const parsed = JSON.parse(m.content);
          parsed.status = "Accepted";
          return { ...m, content: JSON.stringify(parsed) };
        }
        return m;
      }));
      toast.success("Collaboration Proposal Accepted!");
      await handleAutoReply("✅ Collaboration Accepted! Let's discuss details.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept proposal");
    }
  };

  const renderMessageContent = (text, isMine, msgId) => {
    let isProposal = false;
    let proposalData = null;
    try {
      if (text.startsWith('{') && text.endsWith('}')) {
        proposalData = JSON.parse(text);
        isProposal = !!proposalData.title;
      }
    } catch (e) {}

    if (!isProposal && (text.includes("Would you be interested in discussing a potential collaboration?") || text.includes("Interested in Collaborating") || text.includes("Interested to Collaborate") || text.includes("Collaboration Proposal"))) {
      isProposal = true;
    }

    if (isProposal) {
      return (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', maxWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#f59e0b', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proposal</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '600', color: proposalData?.status === 'Accepted' ? '#10b981' : '#f59e0b', background: proposalData?.status === 'Accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '12px' }}>
              {proposalData?.status || 'Pending'}
            </span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
            {proposalData ? proposalData.title : 'Content Campaign'}
          </h3>
          
          {!proposalData && (
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-main)', margin: '0 0 16px 0' }}>
              {text}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: '500' }}>Deliverables</p>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '600' }}>
                {proposalData && proposalData.deliverables 
                  ? (proposalData.deliverables.length > 0 
                      ? proposalData.deliverables.slice(0,2).map(d => `${d.quantity} ${d.name.split(' ')[1] || d.name}`).join(' + ') + (proposalData.deliverables.length > 2 ? '...' : '')
                      : 'None')
                  : 'To Be Discussed'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: '500' }}>Timeline</p>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '600' }}>
                {proposalData ? (proposalData.timeline === 'Custom' ? 'Custom Date' : proposalData.timeline) : 'Flexible'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: '500' }}>Budget</p>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '600' }}>
                {proposalData && proposalData.budget 
                  ? `${proposalData.currency === 'INR' ? '₹' : (proposalData.currency === 'USD' ? '$' : '€')}${proposalData.budget}`
                  : 'Negotiable'}
              </p>
            </div>
          </div>

          {!isMine && (!proposalData || proposalData.status === "Pending") ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => handleAcceptProposal(msgId)}
                style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Accept Proposal
              </button>
            </div>
          ) : null}
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
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading conversation...</p>
      </div>
      {showProposalModal && (
        <CollaborationProposalModal
          onClose={() => setShowProposalModal(false)}
          onSend={handleSendProposal}
          partnerName={partner?.name || partner?.username || 'Creator'}
        />
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-main)' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate("/messages")} style={{ border: 'none', background: 'none', cursor: 'pointer', marginRight: '16px', color: 'var(--text-muted)' }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <Avatar user={partner} size="sm" />
          <div style={{ marginLeft: '12px' }}>
            <VerifiedUserDisplay 
              user={partner}
              showLabel={false}
              nameComponent={<h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{partner?.name || partner?.username}</h2>}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {partner?.role || 'Creator'}
              </span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: socketOnline ? '#10b981' : '#cbd5e1' }}></span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {socketOnline ? "Active now" : "Offline"}
              </p>
            </div>
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

          let proposalData = null;
          let isProposal = false;
          try {
            if (m.content && m.content.startsWith("{") && m.content.includes('"isProposal":true')) {
              proposalData = JSON.parse(m.content);
              isProposal = true;
            }
          } catch(e) {}
          
          // Legacy proposal matching for backward compatibility
          if (!isProposal && m.content && (m.content.includes("Would you be interested in discussing a potential collaboration?") || m.content.includes("Interested in Collaborating") || m.content.includes("Interested to Collaborate") || m.content.includes("Collaboration Proposal"))) {
            isProposal = true;
          }
          
          const senderObj = isMine ? user : partner;
          const senderRole = m.sender?.role || senderObj?.role || 'creator';
          const isCreator = senderRole?.toLowerCase() === 'creator' || senderRole?.toLowerCase() === 'influencer';
          const isBrand = senderRole?.toLowerCase() === 'brand';
          
          let bubbleBg = isCreator ? 'rgba(37, 99, 235, 0.2)' : (isBrand ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)');
          let bubbleBorder = isCreator ? '1px solid rgba(37, 99, 235, 0.5)' : (isBrand ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-light)');
          
          if (isProposal) {
            bubbleBg = 'transparent';
            bubbleBorder = 'none';
          }

          return (
            <div key={m._id || idx} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '16px', padding: '0 16px' }}>
              <div style={{ 
                maxWidth: '75%', 
                padding: '12px 16px', 
                borderRadius: '16px', 
                borderBottomRightRadius: isMine ? '4px' : '16px', 
                borderBottomLeftRadius: isMine ? '16px' : '4px', 
                background: bubbleBg, 
                color: 'var(--text-main)',
                border: bubbleBorder,
                boxShadow: isProposal ? 'none' : '0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                fontSize: '14px',
                lineHeight: '1.5'
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
                            span.style.color = isMine ? '#a1a1aa' : 'var(--text-muted)';
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

      <form style={{ padding: '0', background: 'var(--bg-main)', borderTop: '1px solid var(--border-light)' }} onSubmit={handleSubmit}>
        {previewUrl && (
          <div style={{ margin: '16px 24px 0', position: 'relative', display: 'inline-block' }}>
            {selectedFile?.type.startsWith("video") ? (
              <video src={previewUrl} style={{ height: '100px', borderRadius: '12px', border: '1px solid var(--border-light)' }} />
            ) : (
              <img src={previewUrl} alt="Preview" style={{ height: '100px', borderRadius: '12px', border: '1px solid var(--border-light)' }} />
            )}
            <button 
              type="button"
              onClick={() => { setSelectedFile(null); setPreviewUrl(""); }}
              style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              ×
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '16px 24px 8px' }} className="hide-scrollbar">
          <button 
            type="button" 
            onClick={() => setShowProposalModal(true)}
            style={{ whiteSpace: 'nowrap', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Collaboration Request
          </button>
          <button 
            type="button" 
            style={{ whiteSpace: 'nowrap', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Send Portfolio
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 24px 24px' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '28px', padding: '6px 16px', border: '1px solid var(--border-light)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 12px', fontSize: '15px', color: 'var(--text-main)' }}
              placeholder="Write a message..."
              value={input}
              onChange={handleInputChange}
              autoComplete="off"
            />
            <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
          
          <button 
            type="submit" 
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (!input.trim() && !selectedFile) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)' }}
            disabled={!input.trim() && !selectedFile}
            onMouseOver={(e) => { if (input.trim() || selectedFile) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'translateX(1px) translateY(-1px)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
