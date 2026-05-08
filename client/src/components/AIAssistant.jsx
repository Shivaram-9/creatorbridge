import { useState, useRef, useEffect } from "react";
import { api } from "../services/api.js";
import Avatar from "./Avatar.jsx";
import "./AIAssistant.css";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your CreatorBridge AI. How can I help you today? I can suggest captions, campaign strategies, or growth tips." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.ai.chat(userMsg);
      setMessages(prev => [...prev, { role: "assistant", content: res.response || "I am processing your request..." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-assistant-wrapper ${isOpen ? "open" : ""}`}>
      {/* Floating Button */}
      <button className="ai-fab" onClick={() => setIsOpen(!isOpen)}>
        <span className="ai-icon">✨</span>
        {!isOpen && <span className="ai-label">Ask AI</span>}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="ai-chat-modal slide-up">
          <header className="ai-chat-header">
            <div className="ai-title">
              <span className="sparkle">✨</span>
              <h3>Creator Assistant</h3>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </header>

          <div className="ai-chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message ${msg.role}`}>
                {msg.role === "assistant" && <div className="ai-avatar-mini">🤖</div>}
                <div className="ai-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-message assistant">
                <div className="ai-avatar-mini">🤖</div>
                <div className="ai-bubble typing">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="ai-chat-footer" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
