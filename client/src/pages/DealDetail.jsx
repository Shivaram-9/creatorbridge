import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Avatar from "../components/Avatar.jsx";
import { io } from "socket.io-client";
import "./DealDetail.css";

export default function DealDetail() {
  const { dealId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Negotiation Modal
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [negBudget, setNegBudget] = useState("");
  const [negMessage, setNegMessage] = useState("");

  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    async function loadDeal() {
      try {
        const data = await api.deals.get(dealId);
        if (data.error) setError(data.error);
        else {
          setDeal(data);
          setNegBudget(data.budget);
          
          // Load collaboration chat
          const otherUserId = user.role === "brand" ? data.influencer._id : data.brand._id;
          const chatData = await api.messages.conversation(otherUserId, { dealId });
          setMessages(Array.isArray(chatData) ? chatData : []);
        }
      } catch (err) {
        setError("Failed to load deal details.");
      } finally {
        setLoading(false);
      }
    }
    loadDeal();
  }, [dealId, user.role]);

  useEffect(() => {
    if (!deal) return;
    
    const socket = io(api.getResolvedApiOrigin(), {
      query: { token: localStorage.getItem("creatorbridge_token") }
    });
    socketRef.current = socket;

    socket.on("message", (msg) => {
      if (msg.deal === dealId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => socket.disconnect();
  }, [deal, dealId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const receiverId = user.role === "brand" ? deal.influencer._id : deal.brand._id;
    try {
      const res = await api.messages.send({
        receiverId,
        content: newMessage,
        dealId
      });
      if (!res.error) {
        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async () => {
    if (!window.confirm("Do you accept this deal and sign the digital agreement?")) return;
    try {
      const res = await api.deals.accept(dealId);
      if (res.error) setError(res.error);
      else setDeal(res);
    } catch (err) {
      setError("Failed to accept deal.");
    }
  };

  const handleNegotiate = async () => {
    try {
      const res = await api.deals.negotiate(dealId, {
        budget: Number(negBudget),
        message: negMessage
      });
      if (res.error) setError(res.error);
      else {
        setDeal(res);
        setShowNegotiate(false);
        setNegMessage("");
      }
    } catch (err) {
      setError("Negotiation failed.");
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Mark this deal as completed? This will release the payment to the creator.")) return;
    try {
      const res = await api.deals.complete(dealId);
      if (res.error) setError(res.error);
      else setDeal(res);
    } catch (err) {
      setError("Completion failed.");
    }
  };

  if (loading) return <LoadingSpinner centered />;
  if (error && !deal) return <div className="container"><ErrorBanner message={error} /></div>;
  if (!deal) return null;

  const otherParty = user.role === "brand" ? deal.influencer : deal.brand;

  return (
    <div className="deal-detail-page container slide-in">
      <div className="detail-layout">
        
        {/* Left: Deal Info & Agreement */}
        <div className="detail-main">
          <header className="detail-header">
            <Link to="/deals" className="back-link">← All Deals</Link>
            <div className="header-row">
              <h1>{deal.title}</h1>
              <span className={`status-pill ${deal.status}`}>{deal.status}</span>
            </div>
            <p className="deal-id">Deal ID: {deal._id}</p>
          </header>

          <section className="detail-section">
            <h2 className="section-title">Collaboration Goals</h2>
            <div className="section-card">
              <p>{deal.goals || "No specific goals defined."}</p>
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">Digital Agreement</h2>
            <div className="section-card agreement-card">
              <div className="agreement-header">
                <span className="icon">📝</span>
                <div>
                  <h4>Standard Service Agreement</h4>
                  <p>Legally binding terms for this collaboration.</p>
                </div>
              </div>
              <div className="agreement-status">
                {deal.agreement?.isAccepted ? (
                  <div className="signed-badge">
                    ✅ Signed by {deal.influencer.name || deal.influencer.username} on {new Date(deal.agreement.acceptedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="pending-badge">⚠️ Pending Signature</div>
                )}
              </div>
              <div className="agreement-terms">
                <p>By accepting this deal, the influencer agrees to deliver the requested content within the specified deadline. The brand agrees to release the payment upon successful verification of deliverables.</p>
              </div>
              {!deal.agreement?.isAccepted && user.role === "influencer" && (
                <button className="btn btn-primary btn-full" onClick={handleAccept}>Accept & Sign Agreement</button>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">Deliverables Tracker</h2>
            <div className="deliverables-list">
              {deal.deliverables?.length > 0 ? (
                deal.deliverables.map((del, idx) => (
                  <div key={idx} className={`deliv-item ${del.isCompleted ? 'completed' : ''}`}>
                    <div className="deliv-check">
                      <input 
                        type="checkbox" 
                        checked={del.isCompleted} 
                        readOnly={user.role === "brand"}
                        onChange={() => {}} // Handle update
                      />
                    </div>
                    <div className="deliv-info">
                      <span className="deliv-task">{del.task}</span>
                      {del.proofUrl && <a href={del.proofUrl} target="_blank" rel="noreferrer" className="proof-link">View Proof</a>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-deliverables">No deliverables listed.</div>
              )}
            </div>
          </section>

          {user.role === "brand" && deal.status === "active" && (
            <button className="btn btn-primary btn-full complete-btn" onClick={handleComplete}>
              Complete Deal & Release Payout
            </button>
          )}
        </div>

        {/* Right: Negotiation Chat */}
        <div className="detail-sidebar">
          <div className="sidebar-card chat-card">
            <div className="chat-header">
              <Avatar user={otherParty} size="sm" />
              <div className="chat-partner-info">
                <strong>{otherParty.name || otherParty.username}</strong>
                <span>Collaboration Chat</span>
              </div>
              <button className="btn-neg" onClick={() => setShowNegotiate(true)}>Negotiate</button>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`msg-bubble ${m.sender._id === user._id ? 'mine' : 'theirs'}`}>
                  <p>{m.content}</p>
                  <span className="msg-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSendMessage}>
              <input 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()}>Send</button>
            </form>
          </div>

          <div className="sidebar-card financial-card">
            <h3 className="sidebar-title">Financial Summary</h3>
            <div className="fin-row">
              <span>Agreed Budget</span>
              <span className="fin-val">${deal.budget}</span>
            </div>
            <div className="fin-row">
              <span>Platform Fee (0%)</span>
              <span className="fin-val">$0</span>
            </div>
            <div className="fin-row total">
              <span>{user.role === "brand" ? "Total Payable" : "Net Earnings"}</span>
              <span className="fin-val">${deal.budget}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation Modal */}
      {showNegotiate && (
        <div className="modal-overlay" onClick={() => setShowNegotiate(false)}>
          <div className="modal-content slide-in" onClick={e => e.stopPropagation()}>
            <h2>Negotiate Terms</h2>
            <div className="form-group">
              <label>Proposed Budget ($)</label>
              <input 
                type="number" 
                value={negBudget} 
                onChange={e => setNegBudget(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Message to {otherParty.name || otherParty.username}</label>
              <textarea 
                placeholder="Explain your proposal..."
                value={negMessage}
                onChange={e => setNegMessage(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNegotiate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleNegotiate}>Send Proposal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
