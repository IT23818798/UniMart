import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPaperPlane, 
  FaSearch, 
  FaCheckDouble,
  FaChevronLeft,
  FaBoxOpen,
  FaExternalLinkAlt,
  FaEllipsisH,
  FaPlusCircle,
  FaPlus
} from 'react-icons/fa';
import './ChatPage.css';

const ChatPage = ({ currentUser, userType }) => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const token = localStorage.getItem(userType === 'buyer' ? 'buyerToken' : 'sellerToken');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (activeChat) {
      fetchMessages(activeChat.otherUser.id, activeChat.otherUser.type, true);
      pollingRef.current = setInterval(() => {
        fetchMessages(activeChat.otherUser.id, activeChat.otherUser.type, false);
      }, 3000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeChat?.otherUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/messages/conversations', { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (otherId, otherType, showLoader = false) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/messages/${otherId}?otherType=${otherType}`, { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        if (data.currentUserId) setCurrentUserId(data.currentUserId);
      }
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/messages', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          recipientId: activeChat.otherUser.id,
          recipientType: activeChat.otherUser.type,
          content: newMessage,
          productId: activeChat.lastMessage?.product?._id
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(activeChat.otherUser.id, activeChat.otherUser.type, false);
        fetchConversations();
      }
    } catch (e) { console.error(e); }
  };

  const isMine = (msg) => {
    const senderId = (msg.sender?._id || msg.sender)?.toString();
    const myId = currentUserId?.toString() || currentUser?._id?.toString() || currentUser?.id?.toString();
    if (senderId && myId) return senderId === myId;
    return msg.senderType?.toLowerCase() === userType?.toLowerCase();
  };

  const filtered = conversations.filter(c =>
    c.otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messenger-layout">
      {/* ── Sidebar: Chat List ──────────────────────────────── */}
      <div className={`messenger-sidebar ${activeChat ? 'mobile-hide' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-top">
            <h1 className="sidebar-title">Chats</h1>
            <div className="sidebar-btns">
              <FaEllipsisH />
              <FaPlusCircle />
            </div>
          </div>
          <div className="sidebar-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search Messenger"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="messenger-list scrollbar-messenger">
          {loading && <p className="list-status">Loading chats...</p>}
          {!loading && filtered.length === 0 && <p className="list-status">No messages yet.</p>}
          {filtered.map((conv, i) => {
            const lastWasMe = (conv.lastMessage.sender?._id || conv.lastMessage.sender)?.toString() === (currentUserId || currentUser?._id)?.toString();
            return (
              <div
                key={i}
                className={`conv-card ${activeChat?.otherUser.id === conv.otherUser.id ? 'active' : ''}`}
                onClick={() => setActiveChat(conv)}
              >
                <div className="card-avatar">
                  {conv.otherUser.profileImage ? (
                    <img src={conv.otherUser.profileImage} alt="u" />
                  ) : (
                    <span>{conv.otherUser.name?.[0]?.toUpperCase()}</span>
                  )}
                  <div className="online-indicator" />
                </div>
                <div className="card-info">
                  <span className="card-name">{conv.otherUser.name}</span>
                  <div className="card-preview-row">
                    <p className="card-preview">
                      {lastWasMe ? 'You: ' : ''}{conv.lastMessage.content}
                    </p>
                    <span className="card-dot">·</span>
                    <span className="card-time">
                      {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Chat Area ───────────────────────────────────── */}
      <div className={`messenger-main ${!activeChat ? 'mobile-hide' : ''}`}>
        {!activeChat ? (
          <div className="main-empty">
            <div className="empty-icon">🗨️</div>
            <h2>Welcome to Unimart Chats</h2>
            <p>Select a friend to start a conversation.</p>
          </div>
        ) : (
          <>
            <div className="main-header">
              <div className="header-user">
                <button className="back-btn" onClick={() => setActiveChat(null)}>
                  <FaChevronLeft />
                </button>
                <div className="header-avatar">
                  {activeChat.otherUser.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="header-name">{activeChat.otherUser.name}</h3>
                  <span className="header-status">Active now</span>
                </div>
              </div>
            </div>

            {activeChat.lastMessage?.product && (
              <div className="product-context-bar">
                <img
                  src={activeChat.lastMessage.product.images?.[0] || activeChat.lastMessage.product.image}
                  alt="p"
                />
                <div className="product-info">
                  <span className="p-title">{activeChat.lastMessage.product.title}</span>
                  <span className="p-price">Rs. {activeChat.lastMessage.product.price}</span>
                </div>
                <a href={`/product/${activeChat.lastMessage.product._id}`} target="_blank" rel="noreferrer" className="p-link">
                  <FaExternalLinkAlt /> View
                </a>
              </div>
            )}

            <div className="messenger-messages scrollbar-messenger">
              {messages.map((msg, i) => {
                const mine = isMine(msg);
                return (
                  <div key={i} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                    {!mine && (
                      <div className="msg-avatar-small">
                        {activeChat.otherUser.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="msg-bubble-wrap">
                      <div className={`msg-bubble ${mine ? 'bubble-mine' : 'bubble-theirs'}`}>
                        {msg.content}
                      </div>
                      <span className="msg-time-status">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {mine && <FaCheckDouble className={msg.isRead ? 'read' : ''} />}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="messenger-input-row" onSubmit={sendMessage}>
              <div className="input-btns">
                <FaPlusCircle />
              </div>
              <div className="input-field-wrap">
                <input
                  type="text"
                  placeholder="Aa"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                <FaPaperPlane />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;