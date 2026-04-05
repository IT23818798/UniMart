import React, { useState, useEffect, useRef } from 'react';
import {
    FaPaperPlane,
    FaTimes,
    FaMinus,
    FaExternalLinkAlt,
    FaCircle,
    FaCheck,
    FaCamera,
    FaTrash,
    FaReply
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
    const [isUploading, setIsUploading] = useState(false);
    const [stagedImageUrl, setStagedImageUrl] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const token = localStorage.getItem(userType === 'buyer' ? 'buyerToken' : 'sellerToken');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (otherUserId && otherUserType) {
            setLoading(true);
            setMessages([]);
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
            const res = await fetch(`${API_URL}/api/products/${prodId}`);
            const data = await res.json();
            if (data.success) setActiveProduct(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchMessages = async () => {
        try {
            const pId = (initialProductId?._id || initialProductId)?.toString();
            let url = `${API_URL}/api/messages/${otherUserId}?otherType=${otherUserType}`;
            if (pId && pId !== '[object Object]') url += `&productId=${pId}`;
            
            const res = await fetch(url, {
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

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

            // 2. Persistent upload to server
            const res = await fetch(`${API_URL}/api/messages/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                // Store server URL separately for sending
                setUploadedUrl(data.url);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsUploading(false);
        }
    };

    const sendSystemMessage = async (content, imageUrl = null) => {
        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    recipientId: otherUserId,
                    recipientType: otherUserType,
                    content: content || '',
                    imageUrl: imageUrl || uploadedUrl,
                    repliedTo: replyingTo?._id,
                    productId: initialProductId || activeproduct?._id || activeproduct
                })
            });
            const data = await res.json();
            if (data.success) {
                setNewMessage('');
                setStagedImageUrl(null);
                setUploadedUrl(null);
                setReplyingTo(null);
                fetchMessages();
            }
        } catch (e) { console.error(e); }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !stagedImageUrl && !replyingTo) return;
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
                    // Turn it into placeholder locally
                    setMessages(prev => prev.map(m => 
                        m._id === msgId ? { ...m, isUnsent: true, content: '', imageUrl: null } : m
                    ));
                } else {
                    // Remove locally (if we were the recipient)
                    setMessages(prev => prev.filter(m => m._id !== msgId));
                }
            }
        } catch (e) { console.error(e); }
    };

    const isMine = (msg) => {
        if (!msg) return false;
        const senderId = (msg.sender?._id || msg.sender)?.toString();
        const myId = currentUserId?.toString() || currentUser?._id?.toString() || currentUser?.id?.toString();
        if (senderId && myId) return senderId === myId;
        return false;
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
                            <div className="bubble-wrap group">
                                {msg.repliedTo && (
                                    <div className="reply-preview-bubble">
                                        <div className="reply-content-row">
                                            {msg.repliedTo.imageUrl && (
                                                <img src={msg.repliedTo.imageUrl} alt="rt" className="reply-thumbnail" />
                                            )}
                                            <div className="reply-text-col">
                                                <span className="reply-user">{isMine(msg.repliedTo) ? 'You' : otherUserInfo?.name}</span>
                                                <p className="reply-text truncate">{msg.repliedTo.content || 'Photo'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className={`bubble ${mine ? 'bubble-mine' : 'bubble-theirs'} ${msg.isUnsent ? 'unsent' : ''}`}>
                                    {msg.isUnsent ? (
                                        <span className="unsent-text italic">
                                            {mine ? 'You unsent a message' : 'This message was deleted'}
                                        </span>
                                    ) : (
                                        <>
                                            {msg.imageUrl && (
                                                <img src={msg.imageUrl} alt="upload" className="popup-msg-image" onClick={() => window.open(msg.imageUrl, '_blank')} />
                                            )}
                                            {msg.content}
                                            <div className="popup-msg-actions">
                                                <button onClick={() => setReplyingTo(msg)} title="Reply"><FaReply /></button>
                                                <button onClick={() => deleteMessage(msg._id)} title="Unsend"><FaTrash /></button>
                                            </div>
                                        </>
                                    )}
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

            {replyingTo && (
                <div className="popup-reply-bar">
                    <div className="reply-indicator">
                        <span>Replying to <strong>{isMine(replyingTo) ? 'yourself' : otherUserInfo?.name}</strong></span>
                        <p className="truncate">{replyingTo.content || 'Photo'}</p>
                    </div>
                    <button className="close-reply" onClick={() => setReplyingTo(null)}><FaTimes /></button>
                </div>
            )}

            {stagedImageUrl && (
                <div className="popup-staged-preview">
                    <div className="staged-img-wrap">
                        <img src={stagedImageUrl} alt="staged" />
                        {isUploading ? (
                            <div className="staged-overlay loading"><div className="spinner-tiny" /></div>
                        ) : uploadedUrl && (
                            <div className="staged-overlay success"><FaCheck /></div>
                        )}
                    </div>
                    <button className="remove-staged" onClick={() => { setStagedImageUrl(null); setUploadedUrl(null); }}><FaTimes /></button>
                </div>
            )}

            <form className="popup-footer glass" onSubmit={sendMessage}>
                <div className="footer-icons">
                    <button type="button" className="popup-input-btn" onClick={() => fileInputRef.current.click()} disabled={isUploading}>
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
                <div className="footer-input-wrap">
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
        </div>
    );
};

export default ChatPopup;
