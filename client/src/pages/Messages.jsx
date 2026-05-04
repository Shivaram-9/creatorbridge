import { useState } from "react";
import { MessageIcon } from "../components/Icons.jsx";

const DUMMY_REQUESTS = [
  { id: 1, name: "Travel Explorer", username: "travel_exp", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Travel" },
  { id: 2, name: "Fashion Daily", username: "fashion_daily", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fashion" },
];

const DUMMY_CHATS = [
  { id: 101, name: "Urban Style", lastMsg: "See you at the collab!", time: "2m", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Urban" },
  { id: 102, name: "Alex Creator", lastMsg: "That post was amazing ?!", time: "1h", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
];

export default function Messages() {
  const [activeTab, setActiveTab] = useState("chats");
  const [requests, setRequests] = useState(DUMMY_REQUESTS);
  const [chats, setChats] = useState(DUMMY_CHATS);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hey! How is it going?", sent: false },
    { id: 2, text: "Doing great, just finished a new reel!", sent: true },
    { id: 3, text: "Awesome! Let me know if you want to collaborate on the next one.", sent: false },
  ]);

  const handleAccept = (req) => {
    setRequests(requests.filter(r => r.id !== req.id));
    setChats([{ id: req.id, name: req.name, lastMsg: "You accepted the request", time: "now", avatar: req.avatar }, ...chats]);
  };

  const handleDecline = (id) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setChatMessages([...chatMessages, { id: Date.now(), text: message, sent: true }]);
    setMessage("");
  };

  if (selectedChat) {
    return (
      <div className="messages-v2 slide-in">
        <div className="chat-screen">
          <div className="chat-header">
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedChat(null)}>←</button>
            <div className="chat-item-avatar" style={{ width: 32, height: 32 }}>
              <img src={selectedChat.avatar} alt="" />
            </div>
            <span className="chat-item-name">{selectedChat.name}</span>
          </div>
          <div className="chat-messages">
            {chatMessages.map(m => (
              <div key={m.id} className={`bubble ${m.sent ? 'bubble--right' : 'bubble--left'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input 
              className="chat-input" 
              placeholder="Message..." 
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!message.trim()}>Send</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-v2">
      <div className="header-inner" style={{ padding: '0 0 1rem' }}>
        <h1 className="page-title">Messages</h1>
      </div>

      <div className="msg-tabs">
        <div className={`msg-tab ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab("chats")}>
          Chats ({chats.length})
        </div>
        <div className={`msg-tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab("requests")}>
          Requests ({requests.length})
        </div>
      </div>

      <div className="msg-content slide-in">
        {activeTab === 'chats' ? (
          <div className="chat-list">
            {chats.length === 0 ? (
              <div className="empty-state" style={{ marginTop: '4rem' }}>
                <p className="empty-state__text">No active chats yet.</p>
              </div>
            ) : (
              chats.map(chat => (
                <div key={chat.id} className="chat-list-item" onClick={() => setSelectedChat(chat)}>
                  <div className="chat-item-avatar">
                    <img src={chat.avatar} alt="" />
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{chat.name}</div>
                    <div className="chat-item-last">{chat.lastMsg} · {chat.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="request-list">
            {requests.length === 0 ? (
              <div className="empty-state" style={{ marginTop: '4rem' }}>
                <p className="empty-state__text">No pending requests.</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="chat-list-item" style={{ cursor: 'default' }}>
                  <div className="chat-item-avatar">
                    <img src={req.avatar} alt="" />
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{req.name}</div>
                    <div className="chat-item-last">@{req.username} wants to connect</div>
                  </div>
                  <div className="profile-v2-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(req)}>Accept</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDecline(req.id)}>Decline</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
