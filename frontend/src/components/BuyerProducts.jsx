import React, { useState, useEffect } from 'react';
import './ProductsAndOrders.css';
import ProductSearchFilter from './ProductSearchFilter';

const BuyerProducts = ({ buyer, onAddToCart, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOutput, setFilterOutput] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const pageSize = 100;
      let currentPage = 1;
      let totalPages = 1;
      const allProducts = [];

      do {
        const url = new URL('http://localhost:5000/api/products');
        url.searchParams.append('page', currentPage);
        url.searchParams.append('limit', pageSize);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch products');
        }

        allProducts.push(...(data.data || []));
        totalPages = Number(data.pagesCount || 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Fetching fresh products for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-20 bg-red-50 border border-red-200 rounded-2xl">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Could not load products</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <div className="flex flex-col mb-8">
        <h2 className="marketplace-header mb-0">Browse Products</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        <div className="lg:sticky lg:top-20">
          <ProductSearchFilter
            products={products}
            initialPageSize={12}
            onFilteredProductsChange={setFilterOutput}
          />
        </div>

        <div>
          <div className="text-sm text-gray-500 font-medium mb-4">
            Showing {(filterOutput?.paginatedProducts || products.slice(0, 12)).length} of {(filterOutput?.filteredProducts || products).length} matched products ({products.length} total)
          </div>

          <div className="marketplace-grid flex flex-wrap gap-6 min-h-[400px]">
            {(filterOutput?.paginatedProducts || products.slice(0, 12)).length > 0 ? (
              (filterOutput?.paginatedProducts || products.slice(0, 12)).map((product) => (
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
                <p className="text-gray-500">We couldn't find products matching your current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProducts;
