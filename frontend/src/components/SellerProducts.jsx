import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SellerProducts = ({ seller }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', stock: '', category: 'Electronics', image: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/seller', {
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

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/seller', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching seller orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStockStatus = (stock) => {
    const value = Number(stock);
    if (isNaN(value) || value <= 0) return 'Out of Stock';
    if (value <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const handleGenerateReportPDF = () => {
    try {
      const fileDate = new Date().toISOString().slice(0, 10);
      const width = 842;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const sellerName = seller?.name || 'Seller Dashboard';
      const generatedAt = new Date().toLocaleString();

      doc.setFillColor(20, 88, 150);
      doc.rect(0, 0, width, 70, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Seller Performance Report', 40, 42);
      doc.setFontSize(11);
      doc.text(`Seller: ${sellerName}`, 40, 62);
      doc.text(`Generated: ${generatedAt}`, width - 240, 62);

      const productSummary = products.reduce((summary, product) => {
        const stock = Number(product.stock) || 0;
        summary.totalValue += stock * (Number(product.price) || 0);
        if (stock > 0 && stock <= 10) summary.lowStockCount += 1;
        if (stock <= 0) summary.outOfStockCount += 1;
        return summary;
      }, { totalValue: 0, lowStockCount: 0, outOfStockCount: 0 });

      const overviewY = 90;
      const boxWidth = (width - 100) / 4;
      const stats = [
        { label: 'Products', value: products.length },
        { label: 'Orders', value: orders.length },
        { label: 'Stock Value', value: `Rs ${productSummary.totalValue.toFixed(2)}` },
        { label: 'Low Stock', value: productSummary.lowStockCount }
      ];

      stats.forEach((stat, index) => {
        const x = 40 + (boxWidth + 10) * index;
        doc.setFillColor(244, 247, 252);
        doc.roundedRect(x, overviewY, boxWidth, 62, 10, 10, 'F');
        doc.setTextColor(60, 72, 96);
        doc.setFontSize(10);
        doc.text(stat.label, x + 12, overviewY + 22);
        doc.setFontSize(16);
        doc.setTextColor(20, 88, 150);
        doc.text(String(stat.value), x + 12, overviewY + 45);
      });

      const sectionY = overviewY + 90;
      doc.setTextColor(20, 88, 150);
      doc.setFontSize(14);
      doc.text('Product Inventory', 40, sectionY);

      autoTable(doc, {
        startY: sectionY + 15,
        head: [[ 'Item ID', 'Name', 'Category', 'Unit Price', 'Stock', 'Status' ]],
        body: products.map(product => [
          product._id || '-',
          product.title || '-',
          product.category || '-',
          product.price != null ? `Rs ${product.price}` : '-',
          product.stock != null ? product.stock : '-',
          getStockStatus(product.stock)
        ]),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [20, 88, 150], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        margin: { left: 40, right: 40 }
      });

      if (orders.length > 0) {
        doc.addPage();
        doc.setFillColor(20, 88, 150);
        doc.rect(0, 0, width, 50, 'F');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text('Seller Order Summary', 40, 34);

        const orderStatusCounts = orders.reduce((counts, order) => {
          const status = order.orderStatus || 'unknown';
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        }, {});

        const orderOverviewY = 70;
        const orderBoxes = [
          { label: 'Total Orders', value: orders.length },
          { label: 'Pending', value: orderStatusCounts.pending || 0 },
          { label: 'Done', value: orderStatusCounts.done || orderStatusCounts.delivered || 0 },
          { label: 'Cancelled', value: orderStatusCounts.cancelled || 0 }
        ];

        orderBoxes.forEach((box, index) => {
          const x = 40 + (boxWidth + 10) * index;
          doc.setFillColor(245, 247, 252);
          doc.roundedRect(x, orderOverviewY, boxWidth, 54, 10, 10, 'F');
          doc.setFontSize(10);
          doc.setTextColor(60, 72, 96);
          doc.text(box.label, x + 12, orderOverviewY + 20);
          doc.setFontSize(16);
          doc.setTextColor(20, 88, 150);
          doc.text(String(box.value), x + 12, orderOverviewY + 40);
        });

        doc.setFontSize(14);
        doc.setTextColor(20, 88, 150);
        doc.text('Order Details', 40, orderOverviewY + 85);

        autoTable(doc, {
          startY: orderOverviewY + 95,
          head: [[ 'Order ID', 'Buyer', 'Items', 'Total (Rs)', 'Status' ]],
          body: orders.map(order => [
            order._id?.substring(0, 10) || '-',
            `${order.buyer?.firstName || ''} ${order.buyer?.lastName || ''}`.trim() || '-',
            order.orderItems?.map(item => `${item.title} (x${item.quantity})`).join(', ') || '-',
            order.totalAmount != null ? `Rs ${order.totalAmount}` : '-',
            order.orderStatus || '-'
          ]),
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 6 },
          headStyles: { fillColor: [20, 88, 150], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 248, 252] },
          margin: { left: 40, right: 40 }
        });
      }

      doc.save(`Seller_Report_${fileDate}.pdf`);
    } catch (error) {
      console.error('Error generating seller report PDF:', error);
      alert('Unable to generate report PDF. Please try again.');
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Products</h2>
          <p className="text-sm text-gray-500">Generate product and order reports for your seller dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerateReportPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          >
            Report PDF
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(product.stock) === 'In Stock' ? 'bg-green-100 text-green-800' : getStockStatus(product.stock) === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {getStockStatus(product.stock)}
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
