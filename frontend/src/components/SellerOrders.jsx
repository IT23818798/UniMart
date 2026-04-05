import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

const SellerOrders = ({ seller, refreshKey = 0 }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetchOrders();

    const intervalId = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchOrders(true);
  }, [refreshKey]);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (!silent) setFetchError('');
      const response = await fetch(`http://localhost:5000/api/orders/seller?ts=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          ...(localStorage.getItem('sellerToken')
            ? { 'Authorization': `Bearer ${localStorage.getItem('sellerToken')}` }
            : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(data.data);
      } else {
        if (!silent) {
          setFetchError(data.message || 'Failed to fetch seller orders');
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) {
        setFetchError('Failed to fetch seller orders. Please refresh.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const saveStatus = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/seller/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        },
        body: JSON.stringify({ status: editStatus })
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: editStatus } : o));
        setEditingId(null);
      } else {
        alert(data.message || 'Error updating order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/orders/seller/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
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

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Orders</h2>
        <button
          type="button"
          onClick={() => fetchOrders(false)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <FaSync className="text-xs" /> Refresh
        </button>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 uppercase text-xs text-gray-500">
            <tr>
              <th className="py-3 px-4 text-left">Receipt</th>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="py-3 px-4 text-left">Buyer</th>
              <th className="py-3 px-4 text-left">Contact</th>
              <th className="py-3 px-4 text-left">Items</th>
              <th className="py-3 px-4 text-left">Total</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {orders.map(order => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs text-blue-700">{order.receiptNo || 'N/A'}</td>
                <td className="py-3 px-4 font-mono text-xs">{order._id.substring(0, 8)}...</td>
                <td className="py-3 px-4">{order.buyer?.firstName} {order.buyer?.lastName}</td>
                <td className="py-3 px-4 text-xs text-gray-600">{order.contactPhone || 'N/A'}</td>
                <td className="py-3 px-4">
                  {order.orderItems.map((item, i) => (
                    <div key={i}>{item.title} (x{item.quantity})</div>
                  ))}
                </td>
                <td className="py-3 px-4 font-semibold">Rs {order.totalAmount}</td>
                <td className="py-3 px-4">
                  {editingId === order._id ? (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="border p-1 rounded text-sm bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        ['done', 'delivered'].includes(order.orderStatus) ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {order.orderStatus}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 flex items-center gap-2">
                  {editingId === order._id ? (
                    <>
                      <button onClick={() => saveStatus(order._id)} className="text-green-500 hover:text-green-700" title="Save Status">
                        <FaCheck />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700" title="Cancel">
                        <FaTimes />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingId(order._id); setEditStatus(order.orderStatus); }} className="text-blue-500 hover:text-blue-700" title="Edit Status">
                      <FaEdit />
                    </button>
                  )}
                  <button onClick={() => handleDelete(order._id)} className="text-red-500 hover:text-red-700 ml-2" title="Delete Order">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">No orders received yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerOrders;
