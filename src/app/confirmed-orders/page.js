'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import ProtectedRoute from '../components/ProtectedRoute';
const API_BASE_URL = process.env.API_BASE_URL;

// Add CSS animation
const fadeInAnimation = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default function ConfirmedOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [sum, setSums] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [originalOrders, setOriginalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user } = useAuth();

  // Fetch orders data
  useEffect(() => {
    if (user && user.hotel_id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user || !user.hotel_id) {
        setError('Hotel ID not found. Please login again.');
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/orderconfirm/${user.hotel_id}`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        method: 'GET'
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 404) {
          setOrders([]);
          setOriginalOrders([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
             let sum = 0;
       let confirmed = 0;
       let cancelled = 0;
       for(const item of result.data){
         sum += parseFloat(item.sum_price);
         if(item.status_confirm === 1) {
           confirmed++;
         } else if(item.status_confirm === 2) {
           cancelled++;
         }
       }
      let ordersArray = [];
      if (Array.isArray(result.data)) {
        ordersArray = result.data;
      } else if (Array.isArray(result)) {
        ordersArray = result;
      } else if (result.data && typeof result.data === 'object') {
        ordersArray = [result.data];
      } else {
        ordersArray = [];
      }
             setSums(sum);
       setConfirmedCount(confirmed);
       setCancelledCount(cancelled);
       setOrders(ordersArray);
       setOriginalOrders(ordersArray);
    } catch (err) {
      setError('Failed to load confirmed orders. Please try again later.');
      setOrders([]);
      setOriginalOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    try {
      setIsSearching(true);
      setError(null);
      let filteredOrders = originalOrders.filter(order => {
        let matches = true;
        if (searchOrderId) {
          const searchOrderIdLower = searchOrderId.toLowerCase().trim();
          const orderId = String(order.number_order || '').toLowerCase();
          if (!orderId.includes(searchOrderIdLower)) matches = false;
        }
        if (searchCustomerName && matches) {
          const searchCustomerNameLower = searchCustomerName.toLowerCase().trim();
          const customerName = String(order.customer_name || '').toLowerCase();
          if (!customerName.includes(searchCustomerNameLower)) matches = false;
        }
        if (searchCategory && matches) {
          const searchCategoryLower = searchCategory.toLowerCase().trim();
          const orderCategory = String(order.category || '').toLowerCase();
          if (!orderCategory.includes(searchCategoryLower)) matches = false;
        }
        return matches;
      });
      setOrders(filteredOrders);
      if (filteredOrders.length === 0) {
        showErrorAlert('No confirmed orders found that meet the search criteria.');
      } else {
        const searchTerms = [];
        if (searchOrderId) searchTerms.push(`Order ID: ${searchOrderId}`);
        if (searchCustomerName) searchTerms.push(`Customer: ${searchCustomerName}`);
        if (searchCategory) searchTerms.push(`Category: ${searchCategory}`);
        const searchMessage = searchTerms.length > 0 
          ? `Found ${filteredOrders.length} confirmed orders (${searchTerms.join(', ')})`
          : `Found ${filteredOrders.length} confirmed orders`;
        showSuccessAlert(searchMessage);
      }
    } catch (err) {
      showErrorAlert('There was an error searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchOrderId('');
    setSearchCustomerName('');
    setSearchCategory('');
    setOrders(originalOrders);
    showSuccessAlert('Search reset successfully');
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };
  const showSuccessAlert = (message) => {
    setAlert({ show: true, message, type: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };
  const showErrorAlert = (message) => {
    setAlert({ show: true, message, type: 'error' });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 4000);
  };
  const getStatusConfirmedText = (status_confirm) => {
    if(status_confirm === 0){
        return 'Pending';
    }else if(status_confirm === 1){
        return 'Confirmed';
    }else if(status_confirm === 2){
        return 'Cencelled';
    }else if(status_confirm === 3){
        return 'Completed';
    }else{
        return 'Status Unknown';
    }
  };

  const getStatusConfirmedColor = (status_confirm) => {
    if(status_confirm === 0){
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    }else if(status_confirm === 1){
        return 'bg-green-100 text-green-900 border-green-300';
    }else if(status_confirm === 2){
        return 'bg-red-100 text-red-900 border-red-300';
    }else if(status_confirm === 3){
        return 'bg-blue-100 text-blue-900 border-blue-300';
    }else{
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const getpaymentStatusText = (paymentStatus) => {
    if(paymentStatus === 1){
        return 'Paid';
    }else if(paymentStatus === 2){
        return 'Pending';
    }else if(paymentStatus === 3){
        return 'Refunded';
    }else if(paymentStatus === 4){
        return 'Failed';
    }else{
        return 'Payment Unknown';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    if(paymentStatus === 1){
        return 'bg-green-100 text-green-900 border-green-300';
    }else if(paymentStatus === 2){
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    }else if(paymentStatus === 3){
        return 'bg-red-100 text-red-900 border-red-300';
    }else if(paymentStatus === 4){
        return 'bg-blue-100 text-blue-900 border-blue-300';
    }else{
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading confirmed orders...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!user || !user.hotel_id) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Hotel ID not found. Please login again.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchOrders}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  return (
    <ProtectedRoute>
      <style dangerouslySetInnerHTML={{ __html: fadeInAnimation }} />
      <div className="min-h-screen bg-gray-50">
        {/* Alert Component */}
        {alert.show && (
          <div className="fixed top-4 right-4 z-50" style={{
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <div className={`rounded-lg shadow-lg p-4 max-w-sm ${
              alert.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${
                  alert.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {alert.type === 'success' ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setAlert({ show: false, message: '', type: '' })}
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      alert.type === 'success' 
                        ? 'text-green-400 hover:text-green-500 focus:ring-green-500' 
                        : 'text-red-400 hover:text-red-500 focus:ring-red-500'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Confirmed Orders</h1>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/orders"
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span>All Orders</span>
                </Link>
                <Link 
                  href="/"
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                  <div className="ml-4">
                   <p className="text-sm font-medium text-gray-600">Total Confirmed</p>
                   <p className="text-2xl font-bold text-gray-900">{confirmedCount}</p>
                 </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">{cancelledCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Search Confirmed Orders</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-4 justify-end">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1 text-right">Order ID</label>
                  <input
                    type="text"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm text-right text-gray-900"
                    placeholder="Order ID"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1 text-right">Customer Name</label>
                  <input
                    type="text"
                    value={searchCustomerName}
                    onChange={(e) => setSearchCustomerName(e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm text-right text-gray-900"
                    placeholder="Customer Name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1 text-right">Category</label>
                  <input
                    type="text"
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm text-right text-gray-900"
                    placeholder="Category"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmed Orders Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Confirmed Orders List</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Room Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Check In/Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                     Total Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-8 text-gray-400">No confirmed orders found</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.number_order} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                          <a
                            href={`/orders/${order.number_order}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {order.number_order}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{order.room_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{order.customer_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.room_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.phone_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            <div>In: {formatDate(order.check_in)}</div>
                            <div>Out: {formatDate(order.check_out)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.guests}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        ¥{order.totel_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getPaymentStatusColor(order.payment)}`}>
                            {getpaymentStatusText(order.payment)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getStatusConfirmedColor(order.status_confirm)}`}>
                            {getStatusConfirmedText(order.status_confirm)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              onClick={() => handleViewOrder(order)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmed Order Details</h3>
                  <p className="text-sm text-gray-500">Order ID: {selectedOrder.number_order}</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.email}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Booking Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Room:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.room_name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Room Code:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.room_code}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Check In:</span>
                      <span className="text-sm text-gray-900 ml-2">{formatDate(selectedOrder.check_in)}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Check Out:</span>
                      <span className="text-sm text-gray-900 ml-2">{formatDate(selectedOrder.check_out)}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Guests:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.guests}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  {/* <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Information</h4> */}
                  <div className="space-y-2">
                    {/* <div>
                      <span className="text-sm font-medium text-gray-600">Total Price:</span>
                      <span className="text-sm font-semibold text-gray-900 ml-2">${selectedOrder.sum_price}</span>
                    </div> */}
                    <div>
                      <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ml-2 ${getPaymentStatusColor(selectedOrder.payment)}`}>
                        {getpaymentStatusText(selectedOrder.payment)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Status</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ml-2 ${getStatusConfirmedColor(selectedOrder.status_confirm)}`}>
                        {getStatusConfirmedText(selectedOrder.status_confirm)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <span className="text-sm text-gray-900 ml-2">{formatDateTime(selectedOrder.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 