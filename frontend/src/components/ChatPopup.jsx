import React, { useState, useEffect, useRef } from 'react';
import {
    FaPaperPlane,
    FaTimes,
    FaMinus,
    FaExternalLinkAlt,
    FaCircle,
    FaCheck
} from 'react-icons/fa';
import './ChatPopup.css';

const ChatPopup = ({ currentUser, userType, otherUserId, otherUserType, onClose, initialProductId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [otherUserInfo, setOtherUserInfo] = useState(null);
    const [activeProduct, setActiveProduct] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem(userType === 'buyer' ? 'buyerToken' : 'sellerToken');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        if (otherUserId && otherUserType) {
            if (initialProductId) fetchProduct(initialProductId);
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [otherUserId, otherUserType, initialProductId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isMinimized]);

    const fetchProduct = async (prodId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/products/${prodId}`);
            const data = await res.json();
            if (data.success) setActiveProduct(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/messages/${otherUserId}?otherType=${otherUserType}`, {
                headers, credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
                if (data.otherUser) setOtherUserInfo(data.otherUser);
                if (data.currentUserId) setCurrentUserId(data.currentUserId);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            const res = await fetch('http://localhost:5000/api/messages', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    recipientId: otherUserId,
                    recipientType: otherUserType,
                    content: newMessage,
                    productId: activeProduct?._id || activeProduct
                })
            });
            const data = await res.json();
            if (data.success) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (e) { console.error(e); }
    };

    const isMine = (msg) => {
        const senderId = (msg.sender?._id || msg.sender)?.toString();
        const myId = currentUserId?.toString() || currentUser?._id?.toString() || currentUser?.id?.toString();
        if (senderId && myId) return senderId === myId;
        return msg.senderType?.toLowerCase() === userType?.toLowerCase();
    };

    if (isMinimized) {
        return (
            <div className="messenger-minimized" onClick={() => setIsMinimized(false)}>
                <span className="min-dot" />
                <span className="min-name">{otherUserInfo?.name || 'Messenger'}</span>
            </div>
        );
    }

    return (
        <div className="messenger-popup">
            <div className="popup-header">
                <div className="header-info">
                    <div className="header-avatar-wrap">
                        {otherUserInfo?.profileImage ? (
                            <img src={otherUserInfo.profileImage} alt="u" />
                        ) : (
                            <div className="header-avatar">{otherUserInfo?.name?.[0]?.toUpperCase()}</div>
                        )}
                        <div className="online-indicator" />
                    </div>
                    <div>
                        <h4 className="header-name">{otherUserInfo?.name || '...'}</h4>
                        <span className="header-status">Active now</span>
                    </div>
                </div>
                <div className="header-controls">
                    <button onClick={() => setIsMinimized(true)}><FaMinus /></button>
                    <button onClick={onClose}><FaTimes /></button>
                </div>
            </div>

            {activeProduct && (
                <div className="popup-product-strip">
                    <img src={activeProduct.images?.[0] || activeProduct.image} alt="p" />
                    <div className="product-details">
                        <span className="p-title">{activeProduct.title}</span>
                        <span className="p-price">Rs. {activeProduct.price}</span>
                    </div>
                    <a href={`/product/${activeProduct._id}`} target="_blank" rel="noreferrer" className="p-link">
                        <FaExternalLinkAlt />
                    </a>
                </div>
            )}

            <div className="popup-messages scrollbar-messenger">
                {messages.map((msg, i) => {
                    const mine = isMine(msg);
                    return (
                        <div key={i} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                            {!mine && (
                                <div className="msg-avatar-tiny">
                                    {otherUserInfo?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="bubble-wrap">
                                <div className={`bubble ${mine ? 'bubble-mine' : 'bubble-theirs'}`}>
                                    {msg.content}
                                </div>
                                <span className="msg-time">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="popup-footer" onSubmit={sendMessage}>
                <div className="footer-icons"><FaCircle style={{ color: '#0084ff', fontSize: 18 }} /></div>
                <div className="footer-input-wrap">
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
        </div>
    );
};

export default ChatPopup;
