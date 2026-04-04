import React, { useState, useEffect, useCallback } from 'react';
import './ProductsAndOrders.css';

const BuyerProducts = ({ buyer, onAddToCart, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Beauty', 'Food', 'Other', 'Services'];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('http://localhost:5000/api/products');
      if (searchTerm) url.searchParams.append('keyword', searchTerm);
      if (category && category !== 'All') url.searchParams.append('category', category);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', 12);

      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        setPagesCount(data.pagesCount);
        setTotalProducts(data.totalProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, category, page, fetchProducts]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  if (loading && products.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500 font-medium animate-pulse">Fetching fresh products for you...</p>
    </div>
  );

  return (
    <div className="marketplace-container">
      <div className="flex flex-col mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="marketplace-header mb-0">Browse Products</h2>
          <div className="w-full md:w-1/3 relative">
            <input 
              type="text" 
              placeholder="Search by name or description..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                (category === cat || (cat === 'All' && !category))
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="text-sm text-gray-500 font-medium">
          Showing {products.length} of {totalProducts} products
        </div>
      </div>

      <div className="marketplace-grid flex flex-wrap gap-6 min-h-[400px]">
        {loading ? (
           <div className="col-span-full w-full flex justify-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
           </div>
        ) : products.length > 0 ? (
          products.map(product => (
            <div key={product._id} className="product-card-modern cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1" onClick={() => onProductClick && onProductClick(product)}>
              <div className="relative overflow-hidden rounded-t-xl h-48 bg-gray-50">
                <img 
                  src={product.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                />
                <span className="absolute top-2 right-2 badge-category bg-white/90 backdrop-blur-sm text-blue-600 shadow-sm border-none px-3">
                  {product.category}
                </span>
              </div>
              <div className="product-card-body p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="product-card-title text-lg font-bold text-gray-900 truncate">{product.title}</h3>
                </div>
                <div className="text-xl font-extrabold text-blue-700 mb-2">Rs {product.price}</div>
                <p className="product-card-seller text-xs text-gray-500 mb-3">Seller: <span className="font-semibold text-gray-700">{product.seller?.businessName || 'Unknown'}</span></p>
                
                <div className="product-card-footer mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    disabled={product.stock <= 0}
                    className={`w-full py-2.5 rounded-lg font-bold transition-all shadow-sm ${
                      product.stock > 0 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
            <div className="text-gray-300 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">We couldn't find any products matching your current filters.</p>
            <button 
              onClick={() => {setSearchTerm(''); setCategory(''); setPage(1);}}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagesCount > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12 pb-10">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {[...Array(pagesCount)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                  page === i + 1
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={page === pagesCount}
            onClick={() => setPage(p => Math.min(pagesCount, p + 1))}
            className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BuyerProducts;
