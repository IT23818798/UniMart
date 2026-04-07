import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const SellerProducts = ({ seller }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', stock: '', category: 'Electronics', condition: 'new', availability: 'in_stock', tags: '', image: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/products/seller', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    }
    
    if (name === 'stock') {
      if (value !== '' && !/^\d*$/.test(value)) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      condition: product.condition || 'new',
      availability: product.availability || 'in_stock',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      image: product.images && product.images.length > 0 ? product.images[0] : ''
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://127.0.0.1:5000/api/products/seller/${editingId}`
        : 'http://127.0.0.1:5000/api/products/seller';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags,
          images: [formData.image]
        })
      });
      const data = await response.json();
      if (data.success) {
        if (editingId) {
          setProducts(products.map(p => p._id === editingId ? data.data : p));
        } else {
          setProducts([data.data, ...products]);
        }
        setShowForm(false);
        setEditingId(null);
        setFormData({ title: '', description: '', price: '', stock: '', category: 'Electronics', condition: 'new', availability: 'in_stock', tags: '', image: '' });
      } else {
        alert(data.message || `Error ${editingId ? 'updating' : 'adding'} product`);
      }
    } catch (error) {
      console.error(`Error ${editingId ? 'updating' : 'adding'} product:`, error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/products/seller/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProducts(products.filter(p => p._id !== id));
      } else {
        alert('Server Error Details: ' + JSON.stringify(data));
        console.error('Delete response stringified:', JSON.stringify(data));
      }
    } catch (error) {
      alert('Error deleting product');
      console.error('Error deleting product:', error);
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Products</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData({ title: '', description: '', price: '', stock: '', category: 'Electronics', condition: 'new', availability: 'in_stock', tags: '', image: '' });
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
        >
          <FaPlus /> {editingId && showForm ? 'Cancel Edit' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="title" placeholder="Product Title" value={formData.title} onChange={handleInputChange} required className="border p-2 rounded" />
            <input type="text" inputMode="decimal" name="price" placeholder="Price (Rs)" value={formData.price} onChange={handleInputChange} required className="border p-2 rounded" />
            <input type="text" inputMode="numeric" name="stock" placeholder="Stock Quantity" value={formData.stock} onChange={handleInputChange} required className="border p-2 rounded" />
            <select name="category" value={formData.category} onChange={handleInputChange} className="border p-2 rounded">
              {['Electronics', 'Clothing', 'Books', 'Other', 'Services'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="condition" value={formData.condition} onChange={handleInputChange} className="border p-2 rounded">
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="like_new">Like New</option>
            </select>
            <select name="availability" value={formData.availability} onChange={handleInputChange} className="border p-2 rounded">
              <option value="in_stock">In Stock</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
            </select>
            <input
              type="text"
              name="tags"
              placeholder="Tags (comma separated)"
              value={formData.tags}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <div className="col-span-1 md:col-span-2 border p-3 rounded bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Product Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
              {formData.image && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                  <img src={formData.image} alt="Preview" className="h-32 object-contain border rounded p-1 bg-gray-50" />
                </div>
              )}
            </div>
            <textarea name="description" placeholder="Product Description" value={formData.description} onChange={handleInputChange} required className="border p-2 rounded col-span-1 md:col-span-2" rows="3"></textarea>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{editingId ? 'Update Product' : 'Save Product'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', description: '', price: '', stock: '', category: 'Electronics', condition: 'new', availability: 'in_stock', tags: '', image: '' }); }} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 uppercase text-xs text-gray-500">
            <tr>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Condition</th>
              <th className="py-3 px-4 text-left">Availability</th>
              <th className="py-3 px-4 text-left">Tags</th>
              <th className="py-3 px-4 text-left">Price</th>
              <th className="py-3 px-4 text-left">Stock</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {products.map(product => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="py-3 px-4 flex items-center gap-3">
                  <img src={product.images[0] || 'https://placehold.co/50x50'} alt={product.title} className="w-10 h-10 object-cover rounded" />
                  <span className="font-medium text-gray-900">{product.title}</span>
                </td>
                <td className="py-3 px-4 max-w-[150px] truncate text-gray-500" title={product.description}>
                  {product.description}
                </td>
                <td className="py-3 px-4">{product.category}</td>
                <td className="py-3 px-4">{String(product.condition || 'new').replace('_', ' ')}</td>
                <td className="py-3 px-4">{String(product.availability || 'in_stock').replace('_', ' ')}</td>
                <td className="py-3 px-4 max-w-[180px] truncate" title={Array.isArray(product.tags) ? product.tags.join(', ') : ''}>
                  {Array.isArray(product.tags) && product.tags.length > 0 ? product.tags.join(', ') : '-'}
                </td>
                <td className="py-3 px-4">Rs {product.price}</td>
                <td className="py-3 px-4">{product.stock}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700" title="Edit Product">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-700 ml-3" title="Delete Product">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center py-8 text-gray-500">No products found. Add your first product!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerProducts;
