import React, { useState } from 'react';
import { FaArrowLeft, FaBox, FaStore, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle, FaStar } from 'react-icons/fa';

const OrderDetail = ({ order, onBack, onOrderUpdated }) => {
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  if (!order) return null;

  const submitSellerReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      setIsSubmittingReview(true);
      setReviewError('');
      
      const response = await fetch(`http://localhost:5000/api/seller/info/${order.seller._id}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          orderId: order._id
        })
      });

      const data = await response.json();
      if (data.success) {
        setReviewSuccess(true);
        if (onOrderUpdated) {
          onOrderUpdated({ ...order, isReviewed: true });
        }
      } else {
        setReviewError(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError('Failed connecting to server');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'done':
        return { color: 'text-green-700 font-bold', bg: 'bg-green-50', border: 'border-green-200', icon: FaCheckCircle, label: 'Completed' };
      case 'cancelled':
        return { color: 'text-red-700 font-bold', bg: 'bg-red-50', border: 'border-red-200', icon: FaTimesCircle, label: 'Cancelled' };
      case 'processing':
      case 'shipped':
        return { color: 'text-blue-700 font-bold', bg: 'bg-blue-50', border: 'border-blue-200', icon: FaBox, label: 'In Progress' };
      default:
        return { color: 'text-yellow-700 font-bold', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: FaClock, label: 'Pending' };
    }
  };

  const statusConfig = getStatusConfig(order.orderStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 max-w-5xl mx-auto transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 font-semibold transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg w-fit"
          >
            <FaArrowLeft className="mr-2" /> Back to My Orders
          </button>
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order Details</h2>
             <span className={`px-4 py-1.5 rounded-full text-sm flex items-center gap-2 border shadow-sm ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
               <StatusIcon className="text-lg" />
               <span className="uppercase tracking-wider">{statusConfig.label}</span>
             </span>
          </div>
          <p className="text-gray-500 mt-2 font-mono bg-gray-50 inline-block px-3 py-1 rounded-md border border-gray-200 text-sm">
            Order ID: {order._id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
               <FaBox className="text-gray-400" />
               <h3 className="text-lg font-bold text-gray-800">Items Ordered</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {order.orderItems?.map((item, index) => (
                <div key={index} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-gray-50/50 transition-colors">
                  <div className="w-24 h-24 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center p-2 shadow-sm">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <FaBox className="text-gray-300 text-3xl" />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-500 font-medium">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 inline-block">
                      Rs {(item.price * item.quantity).toFixed(2)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400 mt-2 font-medium">Rs {item.price.toFixed(2)} each</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50/80 p-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-xl font-extrabold text-gray-800">
                <span>Total Amount:</span>
                <span className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">
                   Rs {order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Order Info */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" /> Order Info
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Placed</p>
                <p className="text-gray-900 font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Seller</p>
                <div className="flex items-center gap-2">
                  <FaStore className="text-blue-500" />
                  <span className="font-bold text-gray-900">{order.seller?.businessName || 'Unknown Seller'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Delivery */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-gray-400" /> Delivery Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Method</p>
                <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 font-bold px-3 py-1 rounded-md text-sm capitalize">
                  {order.deliveryMethod || 'Pickup'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Phone</p>
                <div className="flex items-center gap-2 text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <FaPhone className="text-green-600" />
                  {order.contactPhone || order.shippingAddress?.phone || 'Not provided'}
                </div>
              </div>
              {order.shippingAddress && order.shippingAddress.street && (
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</p>
                  <p className="text-gray-800 font-medium">
                    {order.shippingAddress.street}<br/>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Seller Review Section */}
      {(order.orderStatus === 'delivered' || order.orderStatus === 'done') && !order.isReviewed && !reviewSuccess && (
        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaStar className="text-yellow-400" /> Rate Seller: {order.seller?.businessName || 'Unknown Seller'}
          </h3>
          <p className="text-gray-500 mb-6 text-sm">
            How was your experience with this seller? Your feedback helps other buyers!
          </p>

          {reviewError && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{reviewError}</div>}
          
          <form onSubmit={submitSellerReview}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReviewRating(num)}
                    className="text-3xl focus:outline-none transition-transform hover:scale-110"
                  >
                     <FaStar className={num <= reviewRating ? 'text-yellow-400' : 'text-gray-200'} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none resize-none"
                rows="4"
                placeholder="Share your experience (e.g., fast delivery, great quality)"
                required
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSubmittingReview || !reviewComment.trim()}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                isSubmittingReview || !reviewComment.trim() 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
              }`}
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {(order.isReviewed || reviewSuccess) && (
        <div className="mt-8 bg-green-50 rounded-xl border border-green-200 shadow-sm p-6 text-center max-w-2xl mx-auto">
           <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
           <h3 className="text-lg font-bold text-green-800">Review Submitted</h3>
           <p className="text-green-600 mt-1">Thank you for sharing your feedback!</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
