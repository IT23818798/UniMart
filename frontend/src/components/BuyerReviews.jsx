import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaEdit, FaExternalLinkAlt, FaRedo, FaSearch, FaStar, FaTrashAlt } from 'react-icons/fa';

const API_BASE = 'http://127.0.0.1:5000/api';

const BuyerReviews = ({ onViewProduct, onBrowseProducts }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ totalReviews: 0, averageRating: 0 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingReviewId, setSavingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const token = localStorage.getItem('buyerToken');

  const requestOptions = (extraOptions = {}) => ({
    ...extraOptions,
    credentials: 'include',
    headers: {
      ...(extraOptions.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/buyer/reviews`, requestOptions());

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch your reviews');
      }

      const nextReviews = data.data?.reviews || [];
      const nextSummary = data.data?.summary || { totalReviews: 0, averageRating: 0 };

      setReviews(nextReviews);
      setSummary(nextSummary);
    } catch (err) {
      console.error('Error fetching buyer reviews:', err);
      setError(err.message || 'Unable to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reviews;

    return reviews.filter((review) => {
      return [
        review.productTitle,
        review.sellerName,
        review.productCategory,
        review.comment
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [reviews, search]);

  const visibleAverageRating = useMemo(() => {
    if (filteredReviews.length === 0) return 0;

    const sum = filteredReviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return Number((sum / filteredReviews.length).toFixed(1));
  }, [filteredReviews]);

  const mostReviewedCategory = useMemo(() => {
    if (reviews.length === 0) return 'N/A';

    const counts = reviews.reduce((acc, item) => {
      const key = item.productCategory || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const [category] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
    return category || 'N/A';
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const data = [...filteredReviews];

    switch (sortBy) {
      case 'oldest':
        return data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'rating_high':
        return data.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      case 'rating_low':
        return data.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
      case 'product_az':
        return data.sort((a, b) => String(a.productTitle || '').localeCompare(String(b.productTitle || '')));
      case 'product_za':
        return data.sort((a, b) => String(b.productTitle || '').localeCompare(String(a.productTitle || '')));
      case 'newest':
      default:
        return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [filteredReviews, sortBy]);

  const startEdit = (review) => {
    setEditingReviewId(review.reviewId);
    setEditRating(Number(review.rating) || 5);
    setEditComment(review.comment || '');
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleUpdateReview = async (review) => {
    try {
      if (!editComment.trim()) {
        setError('Comment is required to update a review.');
        return;
      }

      setSavingReviewId(review.reviewId);
      setError('');

      const response = await fetch(`${API_BASE}/products/${review.productId}/reviews/${review.reviewId}`, {
        method: 'PUT',
        ...requestOptions({
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        body: JSON.stringify({
          rating: editRating,
          comment: editComment
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update review');
      }

      const updatedProduct = data.data;
      const updatedReview = (updatedProduct.reviews || []).find((item) => String(item._id) === String(review.reviewId));

      if (!updatedReview) {
        await fetchReviews();
      } else {
        setReviews((prev) =>
          prev.map((item) =>
            item.reviewId === review.reviewId
              ? {
                  ...item,
                  rating: updatedReview.rating,
                  comment: updatedReview.comment,
                  createdAt: updatedReview.createdAt || item.createdAt
                }
              : item
          )
        );
      }

      cancelEdit();
    } catch (err) {
      console.error('Error updating review:', err);
      setError(err.message || 'Failed to update review');
    } finally {
      setSavingReviewId(null);
    }
  };

  const handleDeleteReview = async (review) => {
    try {
      const ok = window.confirm(`Delete your review for ${review.productTitle}?`);
      if (!ok) return;

      setDeletingReviewId(review.reviewId);
      setError('');

      const response = await fetch(`${API_BASE}/products/${review.productId}/reviews/${review.reviewId}`, {
        method: 'DELETE',
        ...requestOptions()
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete review');
      }

      const nextReviews = reviews.filter((item) => item.reviewId !== review.reviewId);
      setReviews(nextReviews);

      const totalReviews = nextReviews.length;
      setSummary({ totalReviews, averageRating: 0 });

      if (editingReviewId === review.reviewId) {
        cancelEdit();
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err.message || 'Failed to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-semibold">Please sign in as a buyer to view your reviews.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span className="font-medium">Loading your reviews...</span>
        </div>
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="mb-4 font-semibold text-red-700">{error}</p>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          <FaRedo /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Reviews</h2>
            <p className="text-sm text-gray-500">Manage your product feedback and ratings.</p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="relative w-full md:w-96">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product, seller, category, or comment"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 md:w-56"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="rating_high">Sort: Highest Rating</option>
              <option value="rating_low">Sort: Lowest Rating</option>
              <option value="product_az">Sort: Product A-Z</option>
              <option value="product_za">Sort: Product Z-A</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Reviews</p>
            <p className="mt-2 text-2xl font-bold text-blue-900">{summary.totalReviews}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Filtered Avg</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{visibleAverageRating}</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Most Reviewed Category</p>
            <p className="mt-2 text-base font-bold text-violet-800">{mostReviewedCategory}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sortedReviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-gray-900">
            {reviews.length === 0 ? "You haven't added any reviews yet" : 'No matching reviews'}
          </p>
          <p className="mt-1 text-gray-500">
            {reviews.length === 0
              ? 'When you rate products, they will appear here.'
              : 'Try a different keyword for your search.'}
          </p>
          {reviews.length === 0 ? (
            <button
              onClick={() => onBrowseProducts && onBrowseProducts()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse products
            </button>
          ) : (
            <button
              onClick={fetchReviews}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FaRedo /> Retry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => {
            const isEditing = editingReviewId === review.reviewId;
            const isSaving = savingReviewId === review.reviewId;
            const isDeleting = deletingReviewId === review.reviewId;

            return (
              <div key={review.reviewId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <img
                      src={review.productImage || 'https://via.placeholder.com/88x88?text=No+Image'}
                      alt={review.productTitle}
                      className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                    />
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        Product: <span className="font-bold text-gray-900">{review.productTitle}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Seller: <span className="font-semibold">{review.sellerName || 'Unknown Seller'}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Category: <span className="font-semibold uppercase tracking-wide">{review.productCategory || 'Other'}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Review date:{' '}
                        <span className="font-medium text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 self-start md:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <FaCheckCircle className="text-[11px]" /> Verified Purchase
                      </span>
                      <button
                        onClick={() => onViewProduct && onViewProduct(review.productId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="View product"
                      >
                        <FaExternalLinkAlt className="text-[11px]" /> View Product
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(review)}
                        disabled={isSaving || isDeleting}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review)}
                        disabled={isSaving || isDeleting}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaTrashAlt /> {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <>
                    <div className="mt-4 flex items-center gap-1 text-yellow-500">
                      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Rating</span>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <FaStar key={num} className={num <= review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-gray-700">{review.rating}/5</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Review comment</p>
                      <p>{review.comment || 'No comment provided.'}</p>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-gray-800">Edit your review</p>
                    <div className="mb-3 flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setEditRating(num)}
                          className="text-xl"
                        >
                          <FaStar className={num <= editRating ? 'text-yellow-400' : 'text-gray-300'} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleUpdateReview(review)}
                        disabled={isSaving || !editComment.trim()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerReviews;
