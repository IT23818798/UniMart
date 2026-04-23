import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaFilePdf } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SellerProducts = ({ seller }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', stock: '', category: 'Electronics', image: ''
  });

  useEffect(() => {
    fetchProducts();
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

  const handleGeneratePDF = () => {
    if (products.length === 0) {
      alert('No products available to generate PDF.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header with company branding
    doc.setFillColor(31, 41, 55); // Dark gray background
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('UniMart', 14, 16);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Seller Product Management Report', 14, 22);

    // Report details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Seller: ${seller?.businessName || seller?.name || 'Unknown'}`, 14, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);

    // Add a subtle border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    const rows = products.map((product, index) => {
      const stock = Number(product.stock) || 0;
      const price = Number(product.price) || 0;
      const status = stock === 0 ? 'Out of Stock' : stock <= 10 ? 'Low Stock' : 'In Stock';
      return [
        product._id || `Item-${index + 1}`,
        product.title || 'Untitled',
        stock.toString(),
        `Rs ${price.toFixed(2)}`,
        status
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Item ID', 'Item Name', 'Quantity in Stock', 'Unit Price', 'Status']],
      body: rows,
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        halign: 'left',
        fontSize: 10,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light gray for alternating rows
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Item ID
        1: { cellWidth: 80 }, // Item Name
        2: { cellWidth: 40, halign: 'center' }, // Quantity
        3: { cellWidth: 40, halign: 'right' }, // Price
        4: { cellWidth: 40, halign: 'center' } // Status
      },
      didParseCell: function (data) {
        // Color code status cells
        if (data.column.index === 4) {
          if (data.cell.raw === 'Out of Stock') {
            data.cell.styles.fillColor = [220, 38, 38]; // Red
            data.cell.styles.textColor = [255, 255, 255];
          } else if (data.cell.raw === 'Low Stock') {
            data.cell.styles.fillColor = [245, 158, 11]; // Orange
            data.cell.styles.textColor = [0, 0, 0];
          } else {
            data.cell.styles.fillColor = [34, 197, 94]; // Green
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }
    });

    // Summary section with better styling
    const summaryY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Summary', 14, summaryY);

    const totalItems = products.length;
    const totalValue = products.reduce((sum, product) => {
      const stock = Number(product.stock) || 0;
      const price = Number(product.price) || 0;
      return sum + stock * price;
    }, 0);
    const lowStockCount = products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 10).length;
    const outOfStockCount = products.filter((product) => Number(product.stock) === 0).length;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Total items: ${totalItems}`, 14, summaryY + 10);
    doc.text(`Total stock value: Rs ${totalValue.toFixed(2)}`, 14, summaryY + 18);
    doc.text(`Low-stock items: ${lowStockCount}`, 14, summaryY + 26);
    doc.text(`Out-of-stock items: ${outOfStockCount}`, 14, summaryY + 34);

    // Reorder Recommendation with better formatting
    const needsReorder = products.filter((product) => Number(product.stock) === 0 || (Number(product.stock) > 0 && Number(product.stock) <= 10));
    const noteStartY = summaryY + 50;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Reorder Recommendation', 14, noteStartY);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const recommendation = needsReorder.length > 0
      ? `Reorder ${needsReorder.map((p) => p.title || p._id).join(', ')} to avoid stockouts.`
      : 'All products are currently at healthy stock levels.';
    const splitText = doc.splitTextToSize(recommendation, 250);
    doc.text(splitText, 14, noteStartY + 10);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by UniMart Seller Dashboard', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save('Seller_Product_Report.pdf');
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Products</h2>
          <p className="text-sm text-gray-500">Export your seller catalog and stock summary as a PDF report.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGeneratePDF}
            disabled={products.length === 0}
            className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate PDF Report"
          >
            <FaFilePdf /> Generate PDF
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
