import React, { useMemo, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaEdit, FaTrash, FaPlus, FaFilePdf } from 'react-icons/fa';

const SellerProducts = ({ seller }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', stock: '', category: 'Electronics', image: ''
  });

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('sellerToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/seller', {
        headers: {
          ...authHeaders
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

  const fetchOrdersForReport = async () => {
    const response = await fetch('http://localhost:5000/api/orders/seller', {
      headers: {
        ...authHeaders
      }
    });
    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to fetch orders');
    }
    return data.data || [];
  };

  const generatePdfReport = async () => {
    if (!localStorage.getItem('sellerToken')) {
      alert('Seller session missing. Please login again.');
      return;
    }

    try {
      setGeneratingPdf(true);

      // Ensure we have the latest product list for the report.
      let reportProducts = products;
      if (!reportProducts || reportProducts.length === 0) {
        const response = await fetch('http://localhost:5000/api/products/seller', {
          headers: { ...authHeaders }
        });
        const data = await response.json();
        if (response.ok && data?.success) {
          reportProducts = data.data || [];
        }
      }

      const reportOrders = await fetchOrdersForReport();

      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      const now = new Date();
      const sellerName = seller?.businessName || seller?.fullName || seller?.firstName || 'Seller';
      const title = 'Seller Report (Products & Orders)';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(title, 40, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated for: ${sellerName}`, 40, 70);
      doc.text(`Generated at: ${now.toLocaleString()}`, 40, 85);
      doc.text(`Total Products: ${reportProducts.length}`, 40, 100);
      doc.text(`Total Orders: ${reportOrders.length}`, 40, 115);

      // PRODUCTS TABLE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Products', 40, 145);

      autoTable(doc, {
        startY: 155,
        head: [[
          'ID',
          'Title',
          'Description',
          'Category',
          'Price (Rs)',
          'Stock',
          'Status',
          'Rating',
          'Reviews',
          'Created'
        ]],
        body: (reportProducts || []).map((p) => [
          String(p?._id || '').slice(0, 8),
          p?.title || '',
          p?.description || '',
          p?.category || '',
          p?.price ?? '',
          p?.stock ?? '',
          p?.status || '',
          typeof p?.rating === 'number' ? p.rating.toFixed(1) : (p?.rating ?? ''),
          p?.numOfReviews ?? '',
          p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''
        ]),
        styles: { fontSize: 7, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [22, 163, 74] },
        margin: { left: 40, right: 40 }
      });

      // ORDER TABLE
      const nextY = (doc.lastAutoTable?.finalY || 155) + 30;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Orders', 40, nextY);

      autoTable(doc, {
        startY: nextY + 10,
        head: [[
          'Order ID',
          'Buyer',
          'Items',
          'Total (Rs)',
          'Status',
          'Payment',
          'Method',
          'Created'
        ]],
        body: (reportOrders || []).map((o) => {
          const buyerName = [o?.buyer?.firstName, o?.buyer?.lastName].filter(Boolean).join(' ') || (o?.buyer?.email || '');
          const itemsText = (o?.orderItems || [])
            .map((it) => `${it?.title || 'Item'} x${it?.quantity ?? ''} (Rs ${it?.price ?? ''})`)
            .join('\n');

          return [
            String(o?._id || '').slice(0, 8),
            buyerName,
            itemsText,
            o?.totalAmount ?? '',
            o?.orderStatus || '',
            o?.paymentStatus || '',
            o?.deliveryMethod || '',
            o?.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
          ];
        }),
        styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [22, 163, 74] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 80 },
          2: { cellWidth: 170 },
          3: { cellWidth: 55 },
          4: { cellWidth: 52 },
          5: { cellWidth: 52 },
          6: { cellWidth: 52 },
          7: { cellWidth: 55 }
        },
        margin: { left: 40, right: 40 },
        didDrawPage: (data) => {
          // Simple footer with page number
          const pageCount = doc.getNumberOfPages();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`Page ${pageCount}`, pageWidth - 80, doc.internal.pageSize.getHeight() - 20);
        }
      });

      doc.save(`unimart-seller-report-${now.toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      alert(e?.message || 'Failed to generate PDF report');
    } finally {
      setGeneratingPdf(false);
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
      image: product.images && product.images.length > 0 ? product.images[0] : ''
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://localhost:5000/api/products/seller/${editingId}`
        : 'http://localhost:5000/api/products/seller';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        },
        body: JSON.stringify({
          ...formData,
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
        setFormData({ title: '', description: '', price: '', stock: '', category: 'Electronics', image: '' });
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
      const response = await fetch(`http://localhost:5000/api/products/seller/${id}`, {
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
        <div className="flex items-center gap-2">
          <button
            onClick={generatePdfReport}
            disabled={generatingPdf}
            className={`px-4 py-2 rounded flex items-center gap-2 border transition-colors ${
              generatingPdf
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Generate PDF report of products and orders"
          >
            <FaFilePdf className="text-red-600" />
            {generatingPdf ? 'Generating...' : 'Download PDF Report'}
          </button>

          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingId(null);
                setFormData({ title: '', description: '', price: '', stock: '', category: 'Electronics', image: '' });
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
          >
            <FaPlus /> {editingId && showForm ? 'Cancel Edit' : 'Add Product'}
          </button>
        </div>
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
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', description: '', price: '', stock: '', category: 'Electronics', image: '' }); }} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
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
                  <img src={product.images[0] || 'https://via.placeholder.com/50'} alt={product.title} className="w-10 h-10 object-cover rounded" />
                  <span className="font-medium text-gray-900">{product.title}</span>
                </td>
                <td className="py-3 px-4 max-w-[150px] truncate text-gray-500" title={product.description}>
                  {product.description}
                </td>
                <td className="py-3 px-4">{product.category}</td>
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
                <td colSpan="7" className="text-center py-8 text-gray-500">No products found. Add your first product!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerProducts;
