import React, { useState, useEffect } from 'react';
import { FaStar, FaArrowLeft, FaShoppingCart, FaUserCircle, FaComment, FaPen, FaTrashAlt } from 'react-icons/fa';

const ProductDetail = ({ productId, buyer, onBack, onAddToCart, onChatWithSeller }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [showSellerPopup, setShowSellerPopup] = useState(false);
  const [sellerLoading, setSellerLoading] = useState(false);

  const canSubmitReview = Boolean(localStorage.getItem('buyerToken') && (buyer?._id || buyer?.id));

  const getBuyerRequestOptions = (extraOptions = {}) => ({
    ...extraOptions,
    credentials: 'include',
    headers: {
      ...(extraOptions.headers || {}),
      ...(localStorage.getItem('buyerToken') ? { Authorization: `Bearer ${localStorage.getItem('buyerToken')}` } : {})
    }
  });

  const getReviewOwnerId = (review) => {
    if (!review) return null;
    if (typeof review.user === 'string') return review.user;
    if (review.user?._id) return review.user._id;
    if (typeof review.userId === 'string') return review.userId;
    return review.userId?._id || null;
  };

  const isOwnReview = (review) => {
    const reviewOwnerId = getReviewOwnerId(review);
    const currentBuyerId = buyer?._id || buyer?.id;
    return Boolean(reviewOwnerId && currentBuyerId && reviewOwnerId.toString() === currentBuyerId.toString());
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchSellerDetails = async (sellerId) => {
    if (!sellerId) return;
    try {
      setSellerLoading(true);
      setShowSellerPopup(true);
      const response = await fetch(`http://127.0.0.1:5000/api/seller/info/${sellerId}`, getBuyerRequestOptions());
      const data = await response.json();
      if (data.success) {
        setSellerDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching seller details:', error);
    } finally {
      setSellerLoading(false);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/products/${productId}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    if (!canSubmitReview) {
      setReviewError('Please sign in as a buyer to submit a review.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError('');
      
      const url = editingReviewId 
        ? `http://127.0.0.1:5000/api/products/${productId}/reviews/${editingReviewId}`
        : `http://127.0.0.1:5000/api/products/${productId}/reviews`;
      const method = editingReviewId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        ...getBuyerRequestOptions({
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await response.json();
      if (data.success) {
        setProduct(data.data); // Update product to show new review
        setReviewComment('');
        setReviewRating(5);
        setEditingReviewId(null);
      } else {
        setReviewError(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError('Failed connecting to server');
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;

    if (!canSubmitReview) {
      setReviewError('Please sign in as a buyer to delete your review.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
        ...getBuyerRequestOptions()
      });
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
        if (editingReviewId === reviewId) {
          setEditingReviewId(null);
          setReviewComment('');
          setReviewRating(5);
        }
      } else {
        setReviewError(data.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      setReviewError('Failed to connect to the server');
    }
  };

  const startEditing = (review) => {
    setEditingReviewId(review._id);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
  };

  if (loading) return <div className="p-8 text-center text-gray-500 pb-40">Loading product details...</div>;
  if (!product) return <div className="p-8 text-center text-red-500 pb-40">Product not found</div>;

  const averageRating = Number(product.rating || 0).toFixed(1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-5xl mx-auto mb-20">
      <button 
        onClick={onBack}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors"
      >
        <FaArrowLeft className="mr-2" /> Back to Products
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-gray-50 rounded-xl flex items-center justify-center p-4 h-96">
          <img 
            src={product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'} 
            alt={product.title} 
            className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full uppercase tracking-wider">
              {product.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
          
          <div className="flex items-center mb-4 space-x-4">
            <div className="flex items-center text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={i < (product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'} />
              ))}
              <span className="ml-2 text-gray-600 text-sm">
                {averageRating} ({product.numOfReviews || 0} reviews)
              </span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 text-sm">
              Seller: <span 
                className={`font-semibold ${product.seller?._id ? 'text-blue-600 cursor-pointer hover:underline' : 'text-gray-800'}`}
                onClick={() => product.seller?._id && fetchSellerDetails(product.seller._id)}
              >{product.seller?.businessName || 'Unknown'}</span>
            </span>
          </div>

          <div className="text-3xl font-bold text-gray-900 mb-6">Rs {product.price}</div>
          
          <p className="text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
              </div>
              <button
                onClick={() => onAddToCart(product)}
                disabled={product.stock <= 0}
                className={`flex-1 flex items-center justify-center py-3 px-6 rounded-lg text-white font-semibold shadow-md transition-all ${
                  product.stock > 0 
                    ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg' 
                    : 'bg-gray-400 cursor-not-allowed hidden'
                }`}
              >
                <FaShoppingCart className="mr-2" /> Buy Now
              </button>
            <button
                onClick={() => {
                  if (onChatWithSeller) {
                    onChatWithSeller(product.seller._id || product.seller, product._id);
                  }
                }}
                className="flex items-center justify-center py-3 px-6 rounded-lg bg-green-50 text-green-700 font-semibold border border-green-200 hover:bg-green-100 transition-all shadow-sm"
              >
                <FaComment className="mr-2" /> Chat with Seller
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Write Review Form */}
          <div className="bg-gray-50 rounded-xl p-6 lg:col-span-1 border border-gray-100 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingReviewId ? 'Edit Your Review' : 'Write a Review'}</h3>
            {reviewError && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{reviewError}</div>}

            {!canSubmitReview && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Sign in as a buyer to write, edit, or delete reviews.
              </div>
            )}
            
              <form onSubmit={submitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setReviewRating(num)}
                        disabled={!canSubmitReview || submittingReview}
                        className={`text-2xl focus:outline-none transition-transform ${
                          !canSubmitReview || submittingReview
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:scale-110'
                        }`}
                      >
                        <FaStar className={num <= reviewRating ? 'text-yellow-400' : 'text-gray-300'} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none resize-none"
                    rows="4"
                    placeholder="What did you like or dislike? What did you use this product for?"
                    disabled={!canSubmitReview || submittingReview}
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={!canSubmitReview || submittingReview || !reviewComment.trim()}
                  className={`w-full py-2.5 px-4 rounded-lg text-white font-medium transition-colors ${
                    !canSubmitReview || submittingReview || !reviewComment.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submittingReview ? (editingReviewId ? 'Updating...' : 'Submitting...') : (editingReviewId ? 'Update Review' : 'Submit Review')}
                </button>

                {editingReviewId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReviewId(null);
                      setReviewComment('');
                      setReviewRating(5);
                    }}
                    className="mt-3 w-full py-2.5 px-4 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {!product.reviews || product.reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <div className="text-gray-400 text-4xl mb-3 flex justify-center">
                  <FaStar />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h4>
                <p className="text-gray-500">Be the first to review this product!</p>
              </div>
            ) : (
              product.reviews.map((review) => (
                <div key={review._id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <FaUserCircle className="text-2xl" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{review.name}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          {new Date(review.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'} />
                        ))}
                      </div>

                      {isOwnReview(review) && (
                        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                          <button 
                            onClick={() => startEditing(review)}
                            disabled={submittingReview}
                            aria-label="Edit review"
                            title="Edit review"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <FaPen className="text-sm" />
                          </button>
                          <button 
                            onClick={() => deleteReview(review._id)}
                            disabled={submittingReview}
                            aria-label="Delete review"
                            title="Delete review"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <FaTrashAlt className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mt-3 bg-gray-50/50 p-4 rounded-lg border border-gray-50">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Seller Popup Modal */}
      {showSellerPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowSellerPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 w-8 h-8 flex items-center justify-center transition-colors font-bold z-10"
            >
              ✕
            </button>
            <div className="p-8">
              {sellerLoading ? (
                <div className="text-center py-10 text-gray-500 animate-pulse">Loading seller details...</div>
              ) : sellerDetails ? (
                <>
                  <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
                    <div>
                      <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{sellerDetails.businessName}</h2>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                          sellerDetails.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sellerDetails.isVerified ? 'Verified Seller' : 'Unverified'}
                        </span>
                        <div className="flex items-center text-yellow-500 text-sm bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                          <FaStar className="mr-1" /> 
                          <span className="font-bold text-gray-800 mr-1">{sellerDetails.ratings?.average?.toFixed(1) || 0}</span>
                          <span className="text-gray-500">({sellerDetails.ratings?.totalReviews || 0} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-gray-50 p-5 rounded-xl text-sm border border-gray-100">
                    <div>
                      <span className="text-gray-500 block mb-1 text-xs font-semibold uppercase tracking-wider">Business Type</span>
                      <span className="font-bold text-gray-900 capitalize">{sellerDetails.businessType?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1 text-xs font-semibold uppercase tracking-wider">Location</span>
                      <span className="font-bold text-gray-900">{sellerDetails.address || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1 text-xs font-semibold uppercase tracking-wider">Products</span>
                      <span className="font-bold text-gray-900">{sellerDetails.totalProducts || 0} listings</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-1 text-xs font-semibold uppercase tracking-wider">Joined</span>
                      <span className="font-bold text-gray-900">
                        {new Date(sellerDetails.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                       <FaUserCircle className="text-gray-400" /> Buyer Feedback
                    </h3>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {!sellerDetails.reviews || sellerDetails.reviews.length === 0 ? (
                      <div className="text-gray-500 flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                        <FaStar className="text-gray-300 text-4xl mb-3" />
                        <span className="font-medium">No reviews for this seller yet.</span>
                      </div>
                    ) : (
                      sellerDetails.reviews.map((review, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2">
                               <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                                 <FaUserCircle />
                               </div>
                               <span className="font-bold text-gray-800">{review.buyerName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="flex text-yellow-400 text-sm">
                                 {[...Array(5)].map((_, i) => (
                                   <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'} />
                                 ))}
                               </div>
                               <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                 {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                               </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-50">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl border border-red-100 font-medium">
                  Failed to load seller details. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
