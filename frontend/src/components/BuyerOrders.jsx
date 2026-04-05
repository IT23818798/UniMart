import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit } from 'react-icons/fa';

const BuyerOrders = ({ buyer, onOrderClick, refreshKey, initialOrders = [] }) => {
  const ORDERS_CACHE_MAP_KEY = 'unimart-buyer-orders-cache';
  const ORDERS_CACHE_LATEST_KEY = 'unimart-buyer-orders-latest';
  const resolveBuyerCacheKey = () => {
    const buyerId = String(buyer?._id || buyer?.id || '').trim();
    const buyerEmail = String(buyer?.email || '').trim().toLowerCase();

    if (buyerId) return `id:${buyerId}`;
    if (buyerEmail) return `email:${buyerEmail}`;

    try {
      const storedBuyerRaw = window.localStorage.getItem('buyerData');
      if (!storedBuyerRaw) return '';

      const storedBuyer = JSON.parse(storedBuyerRaw);
      const storedId = String(storedBuyer?._id || storedBuyer?.id || '').trim();
      const storedEmail = String(storedBuyer?.email || '').trim().toLowerCase();

      if (storedId) return `id:${storedId}`;
      if (storedEmail) return `email:${storedEmail}`;
    } catch (error) {
      console.error('Error resolving buyer cache key:', error);
    }

    return '';
  };

  const readCacheMap = () => {
    try {
      const raw = window.localStorage.getItem(ORDERS_CACHE_MAP_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.error('Error reading orders cache map:', error);
      return {};
    }
  };

  const writeCacheMap = (nextMap) => {
    try {
      window.localStorage.setItem(ORDERS_CACHE_MAP_KEY, JSON.stringify(nextMap));
    } catch (error) {
      console.error('Error writing orders cache map:', error);
    }
  };

  const readCachedOrders = () => {
    try {
      const cacheKey = resolveBuyerCacheKey();
      const cacheMap = readCacheMap();
      const mapOrders = cacheKey && Array.isArray(cacheMap[cacheKey]) ? cacheMap[cacheKey] : [];

      if (mapOrders.length > 0) {
        return mapOrders;
      }

      const legacyBuyerId = String(buyer?._id || buyer?.id || '').trim();
      if (!legacyBuyerId) return [];

      const legacyRaw = window.localStorage.getItem(`unimart-buyer-orders-${legacyBuyerId}`);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed)) {
          return legacyParsed;
        }
      }

      const latestRaw = window.localStorage.getItem(ORDERS_CACHE_LATEST_KEY);
      if (!latestRaw) return [];

      const latestParsed = JSON.parse(latestRaw);
      return Array.isArray(latestParsed) ? latestParsed : [];
    } catch (error) {
      console.error('Error reading cached buyer orders:', error);
      return [];
    }
  };

  const writeCachedOrders = (nextOrders) => {
    try {
      const cacheKey = resolveBuyerCacheKey();
      if (!cacheKey) return;

      const cacheMap = readCacheMap();
      cacheMap[cacheKey] = Array.isArray(nextOrders) ? nextOrders : [];
      writeCacheMap(cacheMap);
      window.localStorage.setItem(ORDERS_CACHE_LATEST_KEY, JSON.stringify(nextOrders));

      const legacyBuyerId = String(buyer?._id || buyer?.id || '').trim();
      if (legacyBuyerId) {
        window.localStorage.setItem(`unimart-buyer-orders-${legacyBuyerId}`, JSON.stringify(nextOrders));
      }
    } catch (error) {
      console.error('Error caching buyer orders:', error);
    }
  };

  const getOrderId = (order) => String(order?._id || order?.id || '');

  const [orders, setOrders] = useState(() => {
    const seededOrders = Array.isArray(initialOrders) ? initialOrders : [];
    return seededOrders.length > 0 ? seededOrders : [];
  });
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatePhone, setUpdatePhone] = useState('');
  const [updateQuantity, setUpdateQuantity] = useState(1);

  useEffect(() => {
    const seededOrders = Array.isArray(initialOrders) ? initialOrders : [];
    if (seededOrders.length > 0) {
      setOrders(seededOrders);
      writeCachedOrders(seededOrders);
      return;
    }

    const cached = readCachedOrders();
    if (cached.length > 0) {
      setOrders(cached);
    }
  }, [buyer, initialOrders]);

  useEffect(() => {
    fetchOrders();
  }, [refreshKey, buyer]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/orders/buyer?ts=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          ...(localStorage.getItem('buyerToken')
            ? { 'Authorization': `Bearer ${localStorage.getItem('buyerToken')}` }
            : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        const backendOrders = Array.isArray(data.data) ? data.data : [];
        setOrders(backendOrders);
        writeCachedOrders(backendOrders);
      } else {
        const cachedOrders = readCachedOrders();
        if (cachedOrders.length > 0) {
          setOrders(cachedOrders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      const cachedOrders = readCachedOrders();
      setOrders(cachedOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/orders/buyer/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const nextOrders = orders.filter((o) => getOrderId(o) !== String(orderId));
        setOrders(nextOrders);
        writeCachedOrders(nextOrders);
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        body: JSON.stringify({ contactPhone: updatePhone, quantity: updateQuantity })
      });
      const data = await response.json();
      if (data.success) {
        const editingId = getOrderId(editingOrder);
        const nextOrders = orders.map((o) => getOrderId(o) === editingId ? data.data : o);
        setOrders(nextOrders);
        writeCachedOrders(nextOrders);
        setEditingOrder(null);
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
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
            {orders.map((order, index) => (
              <tr 
                key={getOrderId(order) || `idx-${index}`} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onOrderClick && onOrderClick(order)}
              >
                <td className="py-3 px-4 font-mono text-xs">{(getOrderId(order) || 'unknown').substring(0, 8)}...</td>
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
                  <button onClick={(e) => { e.stopPropagation(); handleEditClick(order); }} className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-1.5" title="Edit Order Details">
                    <FaEdit /> Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(order._id); }} className="px-3 py-1.5 bg-white text-red-500 border border-red-100 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all flex items-center gap-1.5" title="Cancel/Delete Order">
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
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
