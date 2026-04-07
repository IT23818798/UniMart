import React, { useState, useEffect } from 'react';
import { FaTrash, FaDownload } from 'react-icons/fa';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const BuyerOrders = ({ buyer, onOrderClick }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatePhone, setUpdatePhone] = useState('');
  const [updateQuantity, setUpdateQuantity] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [buyer?._id, buyer?.id]);

  const getRequestHeaders = () => {
    const token = localStorage.getItem('buyerToken');
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchOrders = async () => {
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => {
      controller.abort();
    }, 6000);

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/orders/buyer', {
        headers: getRequestHeaders(),
        credentials: 'include',
        signal: controller.signal
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('buyerToken');
        localStorage.removeItem('buyerData');
        setTimeout(() => {
          window.location.href = '/';
        }, 400);
        return;
      }

      if (!response.ok || !data.success) {
        // Keep orders view usable even if API responds with an error.
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching orders:', error);
      }
      // Never block rendering on transient request issues.
      setOrders((prevOrders) => (Array.isArray(prevOrders) ? prevOrders : []));
    } finally {
      clearTimeout(requestTimeout);
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/orders/buyer/${orderId}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.filter(o => o._id !== orderId));
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setUpdatePhone(order.contactPhone || (order.shippingAddress?.phone) || '');
    setUpdateQuantity(order.orderItems?.[0]?.quantity || 1);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/orders/buyer/${editingOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getRequestHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ contactPhone: updatePhone, quantity: updateQuantity })
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o => o._id === editingOrder._id ? data.data : o));
        setEditingOrder(null);
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDownloadPDF = (order, e) => {
    e.stopPropagation();
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); 
    doc.text('UNIMART RECEIPT', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Order ID: ${order._id}`, 14, 30);
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`, 14, 35);
    
    // Seller Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Seller Information', 14, 45);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Business Name: ${order.seller?.businessName || 'N/A'}`, 14, 52);
    doc.text(`Contact: ${order.seller?.phone || 'N/A'}`, 14, 57);

    // Delivery Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Delivery Details', 120, 45);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Method: ${order.deliveryMethod || 'Pickup'}`, 120, 52);
    doc.text(`Phone: ${order.contactPhone || order.shippingAddress?.phone || 'N/A'}`, 120, 57);

    // Table
    const tableColumn = ["Item Description", "Price", "Quantity", "Total"];
    const tableRows = [];

    order.orderItems.forEach(item => {
        tableRows.push([
            item.title,
            `Rs ${item.price.toFixed(2)}`,
            item.quantity.toString(),
            `Rs ${(item.price * item.quantity).toFixed(2)}`
        ]);
    });

    autoTable(doc, {
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    const finalY = doc.lastAutoTable?.finalY || 100;
    
    // Total Amount Breakdown
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total Amount: Rs ${order.totalAmount?.toFixed(2)}`, 14, finalY + 15);
    
    // Footer message
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for shopping at Unimart Student Marketplace!', 14, finalY + 30);

    doc.save(`Unimart_Receipt_${order._id.substring(0,8)}.pdf`);
  };

  if (loading) {
    return <div className="text-gray-600">Loading your orders...</div>;
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent mb-8 tracking-tight">My Orders</h2>

      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80 uppercase text-[11px] font-bold tracking-wider text-gray-500">
            <tr>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="py-3 px-4 text-left">Seller</th>
              <th className="py-3 px-4 text-left">Items</th>
              <th className="py-3 px-4 text-left">Total</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {orders.map(order => (
              (() => {
                const items = Array.isArray(order.orderItems) ? order.orderItems : [];
                const totalAmount = Number.isFinite(order.totalAmount)
                  ? order.totalAmount
                  : items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);

                return (
              <tr 
                key={order._id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onOrderClick && onOrderClick(order)}
              >
                <td className="py-3 px-4 font-mono text-xs">{order._id.substring(0, 8)}...</td>
                <td className="py-3 px-4">{order.seller?.businessName || 'Unknown'}</td>
                <td className="py-3 px-4">
                  {items.map((item, i) => (
                    <div key={i} className="text-gray-800">
                      <span className="font-medium">{item.title}</span> (x{item.quantity}) - <span className="text-gray-500">Rs {item.price}</span>
                    </div>
                  ))}
                </td>
                <td className="py-3 px-4 font-semibold text-blue-600">Rs {totalAmount.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize shadow-sm border ${
                      order.orderStatus === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                      order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                    {order.orderStatus}
                  </span>
                </td>
                <td className="py-4 px-5 flex items-center gap-3">
                  <button onClick={(e) => handleDownloadPDF(order, e)} className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-semibold hover:bg-green-100 transition-all flex items-center gap-1.5" title="Download Receipt PDF">
                    <FaDownload /> PDF
                  </button>
                  {order.orderStatus !== 'cancelled' && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(order._id); }} className="px-3 py-1.5 bg-white text-red-500 border border-red-100 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all flex items-center gap-1.5" title="Cancel/Delete Order">
                    <FaTrash /> Cancel
                  </button>
                  )}
                </td>
              </tr>
                );
              })()
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  You haven't placed any orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update Contact Details</h3>
            <p className="text-sm text-gray-600 mb-4">Update your contact phone number for this pickup order.</p>
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone Number</label>
                <input 
                  type="tel" 
                  value={updatePhone} 
                  onChange={(e) => setUpdatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                  className="w-full mt-1 border px-3 py-2 rounded-md outline-none focus:border-blue-500" 
                  placeholder="Enter your phone number"
                  autoComplete="off"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={updateQuantity} 
                  onChange={(e) => setUpdateQuantity(parseInt(e.target.value) || 1)} 
                  className="w-full mt-1 border px-3 py-2 rounded-md outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;