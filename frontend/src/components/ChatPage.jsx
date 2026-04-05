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
  FaPlus,
  FaCamera,
  FaReply,
  FaTrash,
  FaTimes,
  FaImage,
  FaCheck
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
  const [msgSearchTerm, setMsgSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stagedImageUrl, setStagedImageUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem(userType === 'buyer' ? 'buyerToken' : 'sellerToken');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (activeChat) {
      fetchMessages(activeChat.otherUser.id, activeChat.otherUser.type, true, activeChat.productId);
      pollingRef.current = setInterval(() => {
        fetchMessages(activeChat.otherUser.id, activeChat.otherUser.type, false, activeChat.productId);
      }, 3000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeChat?.otherUser?.id, activeChat?.productId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages/conversations`, { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (otherId, otherType, showLoader = false, productId = null) => {
    try {
      const pId = (productId?._id || productId)?.toString();
      let url = `${API_URL}/api/messages/${otherId}?otherType=${otherType}`;
      if (pId && pId !== '[object Object]') url += `&productId=${pId}`;
      
      const res = await fetch(url, { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        if (data.currentUserId) setCurrentUserId(data.currentUserId);
      }
    } catch (e) { console.error(e); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size validation: Up to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Please upload an image smaller than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploading(true);
      setUploadedUrl(null);

      // 1. Instant local preview
      const localUrl = URL.createObjectURL(file);
      setStagedImageUrl(localUrl);

      // 2. Persistent upload
      const res = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadedUrl(data.url);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (e) {
      console.error(e);
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const sendSystemMessage = async (content, imageUrl = null) => {
    if (!activeChat) return;
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          recipientId: activeChat.otherUser.id,
          recipientType: activeChat.otherUser.type,
          content: content || '',
          imageUrl: imageUrl || uploadedUrl,
          repliedTo: replyingTo?._id,
          productId: activeChat.productId || activeChat.lastMessage?.product?._id
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        setReplyingTo(null);
        setStagedImageUrl(null);
        setUploadedUrl(null);
        fetchMessages(activeChat.otherUser.id, activeChat.otherUser.type, false, activeChat.productId);
        fetchConversations();
      }
    } catch (e) { console.error(e); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !replyingTo && !stagedImageUrl) return;
    sendSystemMessage(newMessage);
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm('Remove message?')) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${msgId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        if (data.message && data.message.includes('unsent')) {
          // It was an unsend (as sender) - turn it into placeholder
          setMessages(prev => prev.map(m => 
            m._id === msgId ? { ...m, isUnsent: true, content: '', imageUrl: null } : m
          ));
        } else {
          // It was a local delete (as recipient) - filter it out
          setMessages(prev => prev.filter(m => m._id !== msgId));
        }
      }
    } catch (e) { console.error(e); }
  };

  const deleteConversation = async () => {
    if (!activeChat || !window.confirm('Delete entire conversation for you?')) return;
    try {
      const pId = (activeChat.productId?._id || activeChat.productId || activeChat.lastMessage?.product?._id || activeChat.lastMessage?.productId);
      const res = await fetch(`http://localhost:5000/api/messages/conversation/${activeChat.otherUser.id}?otherType=${activeChat.otherUser.type}&productId=${pId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      if (res.ok) {
        setActiveChat(null);
        fetchConversations();
      }
    } catch (e) { console.error(e); }
  };

  const handleChatClick = (conv) => {
    setMessages([]);
    setLoading(true);
    setActiveChat(conv);
  };

  const isMine = (msg) => {
    if (!msg) return false;
    const senderId = (msg.sender?._id || msg.sender)?.toString();
    const myId = currentUserId?.toString() || currentUser?._id?.toString() || currentUser?.id?.toString();
    if (senderId && myId) return senderId === myId;
    return false;
  };

  const filteredConversations = conversations.filter(c =>
    c.otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(m => 
    m.content?.toLowerCase().includes(msgSearchTerm.toLowerCase()) ||
    (m.imageUrl && msgSearchTerm === '') // Show all if search is empty
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
          {!loading && filteredConversations.length === 0 && <p className="list-status">No messages yet.</p>}
          {filteredConversations.map((conv, i) => {
            const lastWasMe = (conv.lastMessage.sender?._id || conv.lastMessage.sender)?.toString() === (currentUserId || currentUser?._id)?.toString();
            const convProdId = (conv.productId?._id || conv.productId)?.toString();
            const activeProdId = (activeChat?.productId?._id || activeChat?.productId)?.toString();
            const isActive = activeChat?.otherUser.id === conv.otherUser.id && activeProdId === convProdId;

            return (
              <div
                key={i}
                className={`conv-card ${isActive ? 'active' : ''}`}
                onClick={() => handleChatClick(conv)}
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
                  <div className="card-top-row">
                    <span className="card-name">{conv.otherUser.name}</span>
                    {conv.lastMessage.product && (
                      <span className="card-product-tag">{conv.lastMessage.product.title.substring(0, 15)}...</span>
                    )}
                  </div>
                  <div className="card-preview-row">
                    <p className="card-preview">
                      {lastWasMe ? 'You: ' : ''}
                      {conv.lastMessage.imageUrl ? '📷 Photo' : conv.lastMessage.content}
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
              <div className="header-actions">
                <button className="action-btn" onClick={() => setShowSearch(!showSearch)}>
                  <FaSearch />
                </button>
                <button className="action-btn danger" onClick={deleteConversation}>
                  <FaTrash />
                </button>
              </div>
            </div>

            {showSearch && (
              <div className="chat-search-bar">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search in conversation..." 
                  value={msgSearchTerm}
                  onChange={(e) => setMsgSearchTerm(e.target.value)}
                  autoFocus
                />
                <button className="close-search" onClick={() => { setMsgSearchTerm(''); setShowSearch(false); }}>
                  <FaTimes />
                </button>
              </div>
            )}

            {activeChat.productId && (
              <div className="product-context-bar glass">
                <img
                  src={activeChat.lastMessage.product?.images?.[0] || activeChat.lastMessage.product?.image}
                  alt="p"
                />
                <div className="product-info">
                  <span className="p-title">{activeChat.lastMessage.product?.title}</span>
                  <span className="p-price">Rs. {activeChat.lastMessage.product?.price}</span>
                </div>
                <a href={`/product/${activeChat.productId}`} target="_blank" rel="noreferrer" className="p-link">
                  <FaExternalLinkAlt /> View
                </a>
              </div>
            )}

            <div className="messenger-messages scrollbar-messenger">
              {filteredMessages.map((msg, i) => {
                const mine = isMine(msg);
                return (
                  <div key={i} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                    {!mine && (
                      <div className="msg-avatar-small">
                        {activeChat.otherUser.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="msg-bubble-wrap group">
                      {msg.repliedTo && (
                        <div className="reply-preview-bubble">
                          <div className="reply-content-row">
                            {msg.repliedTo.imageUrl && (
                              <img src={msg.repliedTo.imageUrl} alt="rt" className="reply-thumbnail" />
                            )}
                            <div className="reply-text-col">
                              <span className="reply-user">
                                {isMine(msg.repliedTo) ? 'You' : activeChat.otherUser.name}
                              </span>
                              <p className="reply-text truncate">
                                {msg.repliedTo.content || 'Photo'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className={`msg-bubble ${mine ? 'bubble-mine' : 'bubble-theirs'} ${msg.isUnsent ? 'unsent' : ''}`}>
                        {msg.isUnsent ? (
                          <span className="unsent-text italic">
                            {mine ? 'You unsent a message' : 'This message was deleted'}
                          </span>
                        ) : (
                          <>
                            {msg.imageUrl && (
                              <div className="msg-image-container">
                                <img src={msg.imageUrl} alt="uploaded" className="msg-image" onClick={() => window.open(msg.imageUrl, '_blank')} />
                              </div>
                            )}
                            {msg.content}
                            <div className="msg-actions-overlay">
                              <button onClick={() => setReplyingTo(msg)} title="Reply"><FaReply /></button>
                              <button onClick={() => deleteMessage(msg._id)} title="Unsend"><FaTrash /></button>
                            </div>
                          </>
                        )}
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

            {replyingTo && (
              <div className="replying-context-bar">
                <div className="reply-info">
                  <FaReply className="reply-icon" />
                  <div className="reply-details">
                    <span className="reply-to">Replying to {isMine(replyingTo) ? 'yourself' : activeChat.otherUser.name}</span>
                    <p className="reply-content truncate">{replyingTo.content || 'Image'}</p>
                  </div>
                </div>
                <button className="cancel-reply" onClick={() => setReplyingTo(null)}><FaTimes /></button>
              </div>
            )}

            {stagedImageUrl && (
              <div className="staged-image-preview">
                <div className="staged-container">
                  <img src={stagedImageUrl} alt="staging" />
                  {isUploading ? (
                    <div className="staged-overlay loading"><div className="spinner-tiny" /></div>
                  ) : uploadedUrl && (
                    <div className="staged-overlay success"><FaCheck /></div>
                  )}
                  <button className="remove-staged" onClick={() => { setStagedImageUrl(null); setUploadedUrl(null); }}>
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}

            <form className="messenger-input-row glass" onSubmit={sendMessage}>
              <div className="input-btns">
                <button type="button" className="input-btn" onClick={() => fileInputRef.current.click()} disabled={isUploading}>
                  <FaCamera />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="input-field-wrap">
                <input
                  type="text"
                  placeholder="Aa"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="send-btn" disabled={(!newMessage.trim() && !stagedImageUrl) || isUploading}>
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