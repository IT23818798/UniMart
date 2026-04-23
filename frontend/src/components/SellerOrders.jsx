import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

const SellerOrders = ({ seller }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/orders/seller', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
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

  const saveStatus = async (orderId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/orders/seller/${orderId}/status`, {
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
      const response = await fetch(`http://127.0.0.1:5000/api/orders/seller/${orderId}`, {
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Orders</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 uppercase text-xs text-gray-500">
            <tr>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="py-3 px-4 text-left">Buyer</th>
              <th className="py-3 px-4 text-left">Items</th>
              <th className="py-3 px-4 text-left">Total</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {orders.map(order => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs">{order._id.substring(0, 8)}...</td>
                <td className="py-3 px-4">{order.buyer?.firstName} {order.buyer?.lastName}</td>
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
                <td colSpan="6" className="text-center py-8 text-gray-500">No orders received yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerOrders;
