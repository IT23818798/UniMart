import React, { useState, useEffect } from 'react';
import { FaTrash, FaDownload, FaStar } from 'react-icons/fa';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const BuyerOrders = ({ buyer, onOrderClick }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatePhone, setUpdatePhone] = useState('');
  const [updateQuantity, setUpdateQuantity] = useState(1);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/orders/buyer', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/orders/buyer/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        }
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
      const response = await fetch(`http://127.0.0.1:5000/api/orders/buyer/${editingOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingOrder) return;
    
    setReviewSubmitting(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/seller/info/${reviewingOrder.seller._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          orderId: reviewingOrder._id
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Review submitted successfully!');
        setOrders(orders.map(o => o._id === reviewingOrder._id ? { ...o, isReviewed: true } : o));
        setReviewingOrder(null);
        setReviewRating(5);
        setReviewComment('');
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred while submitting your review.');
    } finally {
      setReviewSubmitting(false);
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

  if (loading) return <div>Loading your orders...</div>;

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
              <React.Fragment key={order._id}>
              <tr 
                className={`cursor-pointer transition-colors ${reviewingOrder?._id === order._id ? 'bg-purple-50/40' : 'hover:bg-gray-50'}`}
                onClick={() => onOrderClick && onOrderClick(order)}
              >
                <td className="py-3 px-4 font-mono text-xs">{order._id.substring(0, 8)}...</td>
                <td className="py-3 px-4">{order.seller?.businessName || 'Unknown'}</td>
                <td className="py-3 px-4">
                  {order.orderItems.map((item, i) => (
                    <div key={i} className="text-gray-800">
                      <span className="font-medium">{item.title}</span> (x{item.quantity}) - <span className="text-gray-500">Rs {item.price}</span>
                    </div>
                  ))}
                </td>
                <td className="py-3 px-4 font-semibold text-blue-600">Rs {order.totalAmount.toFixed(2)}</td>
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
                  {(order.orderStatus.toLowerCase() === 'done' || order.orderStatus.toLowerCase() === 'delivered') && !order.isReviewed && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setReviewingOrder(order); }}
                      className="px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg text-sm font-semibold hover:bg-purple-100 transition-all flex items-center gap-1.5"
                      title="Rate Seller"
                    >
                      <FaStar /> Rate
                    </button>
                  )}
                  {(order.orderStatus.toLowerCase() === 'done' || order.orderStatus.toLowerCase() === 'delivered') && order.isReviewed && (
                    <span className="px-3 py-1.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-not-allowed">
                      <FaStar /> Rated
                    </span>
                  )}
                </td>
              </tr>
              {reviewingOrder && reviewingOrder._id === order._id && (
                <tr className="bg-purple-50/10">
                  <td colSpan="6" className="p-0 border-b-2 border-purple-100">
                    <div className="p-6 bg-gradient-to-r from-transparent via-purple-50/30 to-purple-50/60 flex justify-end">
                      <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6 w-full max-w-md relative animate-in fade-in slide-in-from-top-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-4 right-4 text-purple-300 hover:text-purple-500 cursor-pointer text-lg" onClick={() => setReviewingOrder(null)}>✕</div>
                        <h3 className="text-lg font-bold mb-1 text-purple-800">Rate Your Experience</h3>
                        <p className="text-xs text-gray-500 mb-5">With <b className="text-gray-800">{reviewingOrder.seller?.businessName || 'this seller'}</b></p>
                        
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Select Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className={`text-2xl transition-transform hover:scale-110 ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2 mt-4 uppercase tracking-wide">Comment (Optional)</label>
                            <textarea 
                              value={reviewComment}
                              onChange={e => setReviewComment(e.target.value)}
                              className="w-full border px-3 py-2 text-sm rounded-lg outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all min-h-[80px] resize-none"
                              placeholder="Share details of your experience..."
                            />
                          </div>

                          <div className="flex justify-end gap-3 mt-4 pt-2">
                            <button type="button" onClick={() => setReviewingOrder(null)} className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 focus:outline-none" disabled={reviewSubmitting}>Cancel</button>
                            <button type="submit" className="px-5 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 shadow-sm transition-colors flex items-center justify-center min-w-[110px] focus:outline-none" disabled={reviewSubmitting}>
                              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
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