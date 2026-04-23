import React, { useState, useEffect } from 'react';
import { FaStar, FaBox, FaUserCircle } from 'react-icons/fa';

const SellerReviews = ({ seller }) => {
  const [productReviews, setProductReviews] = useState([]);
  const [liveSellerReviews, setLiveSellerReviews] = useState(seller?.reviews || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductReviews();
    fetchLatestSellerReviews();
  }, [seller]);

  const fetchLatestSellerReviews = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/seller/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sellerToken') || ''}` 
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.data && data.data.seller && data.data.seller.reviews) {
        setLiveSellerReviews(data.data.seller.reviews);
      }
    } catch (error) {
      console.error('Error fetching latest seller reviews:', error);
    }
  };

  const fetchProductReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:5000/api/products/seller', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sellerToken') || ''}` 
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        // Extract reviews from all products
        let allReviews = [];
        data.data.forEach(product => {
          if (product.reviews && product.reviews.length > 0) {
            product.reviews.forEach(review => {
              allReviews.push({
                ...review,
                productTitle: product.title,
                productId: product._id,
                productImage: product.images?.[0]
              });
            });
          }
        });
        
        // Sort by date newest first
        allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProductReviews(allReviews);
      }
    } catch (error) {
      console.error('Error fetching product reviews:', error);
    } finally {
      setLoading(false);
    }
  };
  const sellerReviewsList = [...liveSellerReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const renderStars = (rating) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <FaStar key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-200'} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Product Reviews Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FaBox className="mr-2 text-blue-500" /> Item Reviews
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {productReviews.length} Reviews
          </span>
        </div>
        
        {productReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
            No item reviews found yet.
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {productReviews.map((review, index) => (
              <div key={index} className="border border-gray-100 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <div className="mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Product: {review.productTitle}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seller Reviews Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FaUserCircle className="mr-2 text-green-500" /> Seller Profile Reviews
          </h2>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {sellerReviewsList.length} Reviews
          </span>
        </div>
        
        {sellerReviewsList.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
            No seller reviews found yet.
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {sellerReviewsList.map((review, index) => (
              <div key={index} className="border border-gray-100 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.buyerName || 'Anonymous'}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SellerReviews;
