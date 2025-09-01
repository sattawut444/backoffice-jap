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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user } = useAuth();

  // Fetch orders data
  useEffect(() => {
    console.log('Orders useEffect triggered, user:', user);
    if (user && user.hotel_id) {
      console.log('Fetching orders for hotel_id:', user.hotel_id);
      fetchOrders();
    } else {
      console.log('No user or hotel_id found');
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || !user.hotel_id) {
        console.error('No hotel_id found in user data');
        setError('Hotel ID not found. Please login again.');
        return;
      }
      
      // เพิ่ม timeout สำหรับ API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      const response = await fetch(`${API_BASE_URL}/api/attraction/backoffice/getordersattraction/${user.user_attraction_id}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Orders API endpoint not found, using demo data');
          // ใช้ demo data แทน
          setOrders([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      let ordersArray = [];
      if (Array.isArray(result.data)) {
        ordersArray = result.data;
      } else if (Array.isArray(result)) {
        ordersArray = result;
      } else if (result.data && typeof result.data === 'object') {
        ordersArray = [result.data];
      } else {
        console.warn('Unexpected API response structure:', result);
        ordersArray = [];
      }
      if (ordersArray.length > 0) {
        console.log('Sample order structure:', ordersArray[0]);
      }
      setOrders(ordersArray);
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      // จัดการ timeout error
      if (err.name === 'AbortError') {
        console.warn('API request timed out, using demo data');
        setOrders([]);
      } else {
        setError('Failed to load orders. Please try again later.');
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    try {
      setIsSearching(true);
      setError(null);
      
      // เก็บข้อมูลเดิมไว้
      const originalOrders = Array.isArray(orders) ? orders : [];
      
      // กรองข้อมูลตามเงื่อนไขการค้นหา
      let filteredOrders = originalOrders.filter(order => {
        let matches = true;
        
        // ค้นหาตาม Order ID
        if (searchOrderId) {
          const searchOrderIdLower = searchOrderId.toLowerCase();
          const orderId = String(order.number_order || '').toLowerCase();
          if (!orderId.includes(searchOrderIdLower)) {
            matches = false;
          }
        }
        
        // ค้นหาตาม Customer Name
        if (searchCustomerName && matches) {
          const searchCustomerNameLower = searchCustomerName.toLowerCase();
          const customerName = String(order.customer_name || '').toLowerCase();
          if (!customerName.includes(searchCustomerNameLower)) {
            matches = false;
          }
        }
        
        // ค้นหาตาม Status
        if (searchStatus && matches) {
          const searchStatusLower = searchStatus.toLowerCase();
          const orderStatus = String(order.status_check || 0);
          if (!orderStatus.includes(searchStatusLower)) {
            matches = false;
          }
        }
        
        // ค้นหาตาม Category
        if (searchCategory && matches) {
          const searchCategoryLower = searchCategory.toLowerCase();
          const orderCategory = String(order.category || '').toLowerCase();
          if (!orderCategory.includes(searchCategoryLower)) {
            matches = false;
          }
        }
        
        return matches;
      });
      
      // อัปเดตข้อมูลที่แสดง
      setOrders(filteredOrders);
      
      if (filteredOrders.length === 0) {
        showErrorAlert('ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไขการค้นหา');
      } else {
        const searchTerms = [];
        if (searchOrderId) searchTerms.push(`Order ID: ${searchOrderId}`);
        if (searchCustomerName) searchTerms.push(`Customer: ${searchCustomerName}`);
        if (searchCategory) searchTerms.push(`Category: ${searchCategory}`);
        if (searchStatus) searchTerms.push(`Status: ${searchStatus}`);
        
        const searchMessage = searchTerms.length > 0 
          ? `พบคำสั่งซื้อ ${filteredOrders.length} รายการ (${searchTerms.join(', ')})`
          : `พบคำสั่งซื้อ ${filteredOrders.length} รายการ`;
        
        showSuccessAlert(searchMessage);
      }
    } catch (err) {
      console.error('Error searching orders:', err);
      showErrorAlert('There was an error searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchOrderId('');
    setSearchCustomerName('');
    setSearchStatus('');
    setSearchCategory('');
    // โหลดข้อมูลเดิมกลับมา
    fetchOrders();
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    
    try {
      // เพิ่ม timeout สำหรับ API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/UpdateStatusConfirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: orderId,
          status_confirm: newStatus 
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
      }

      showSuccessAlert('Order status updated successfully!');
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order status:', error);
      showErrorAlert(`Failed to update order status. Error: ${error.message}`);
    }
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
    if(status_confirm === 1){
        return 'Confirmed';
    }else if(status_confirm === 2){
        return 'Pending';
    }else if(status_confirm === 3){
        return 'Cancelled';
    }else if(status_confirm === 4){
        return 'Completed';
    }else{
        return 'Status Unknown';
    }
  };

  const getStatusConfirmedColor = (status) => {
    if(status === 0){
      return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    }else if(status === 1){
      return 'bg-green-100 text-green-900 border-green-300';
    }else if(status === 2){
        return 'bg-red-100 text-red-900 border-red-300';
    }else if(status === 3){
        return 'bg-blue-100 text-blue-900 border-blue-300';
    }else{
      return 'bg-green-100 text-green-900 border-green-300';
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
  const getStatusText = (status) => {
    if(status === 0){
        return 'Inactive';
    }else if(status === 1){
        return 'Active';
    }else{
        return 'Status Unknown';
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
            <p className="mt-4 text-gray-600">Loading orders...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Orders Attraction Management</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{Array.isArray(orders) ? orders.length : 0}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Array.isArray(orders) && orders.length > 0
                    ? orders.filter(order => order.status_check === 1).length
                    : 0}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Inactive</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Array.isArray(orders) && orders.length > 0
                    ? orders.filter(order => order.status_check === 0).length
                    : 0}
                </p>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Search Orders</h3>
            </div>
            <div className="p-4">
              {/* แสดงผลการค้นหาปัจจุบัน */}
              {(searchOrderId || searchCustomerName || searchCategory || searchStatus) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-900">Active Search:</span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {searchOrderId && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Order ID: {searchOrderId}
                        <button
                          onClick={() => setSearchOrderId('')}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                          title="Remove order ID filter"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {searchCustomerName && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Customer: {searchCustomerName}
                        <button
                          onClick={() => setSearchCustomerName('')}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                          title="Remove customer name filter"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {/* {searchStatus && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Status: {searchStatus}
                        <button
                          onClick={() => setSearchStatus('')}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                          title="Remove category filter"
                        >
                          ×
                        </button>
                      </span>
                    )} */}
                    {/* {searchStatus && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Status: {searchStatus}
                      </span>
                    )} */}
                  </div>
                </div>
              )}
              
              {/* แสดงตัวอย่าง Category ที่มีอยู่ในระบบ */}
              <div className="mb-3 text-xs text-gray-500 flex items-center space-x-4">
                <span><span className="font-medium">Available Categories:</span> hotel, museum</span>
                <span><span className="font-medium">Search Tips:</span> Use partial text, press Enter to search</span>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-end">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1 text-right">Order ID</label>
                  <input
                    type="text"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-right text-gray-900"
                    placeholder="Order ID"
                    title="Enter partial Order ID to search"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1 text-right">Customer Name</label>
                  <input
                    type="text"
                    value={searchCustomerName}
                    onChange={(e) => setSearchCustomerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-right text-gray-900"
                    placeholder="Customer Name"
                    title="Enter partial customer name to search"
                  />
                </div>
                {/* <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1 text-right">Category</label>
                  <input
                    type="text"
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-right text-gray-900"
                    placeholder="hotel, museum"
                    title="Examples: category"
                  />
                </div> */}
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1 text-right">Status</label>
                  <select
                    value={searchStatus}
                    onChange={(e) => setSearchStatus(e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-right text-gray-900"
                  >
                    <option value="">All Status</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
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

          {/* Orders Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Orders List</h2>
                <div className="text-sm text-gray-600">
                  {Array.isArray(orders) ? (
                    <span>
                      Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
                      {(searchOrderId || searchCustomerName || searchCategory || searchStatus) && (
                        <span className="text-blue-600"> (filtered)</span>
                      )}
                    </span>
                  ) : (
                    <span>No orders</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Attraction Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ¥(JPY)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Day_use
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!Array.isArray(orders) || orders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-400">No order information</td>
                    </tr>
                  ) : (
                    orders.map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{order.number_order}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{order.attraction_list_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{order.firstname} {order.lastname}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>
                            <div className="text-sm font-semibold text-green-500">{order.attraction_list_price_jpy}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.phone_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(order.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getStatusConfirmedColor(order.status_check)}`}>
                            {order.message || getStatusText(order.status_check)}
                          </span>
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
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
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
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.phone_number}</span>
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
                      <span className="text-sm font-medium text-gray-600">Guests:</span>
                      <span className="text-sm text-gray-900 ml-2">{selectedOrder.guests}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total Price:</span>
                      <span className="text-sm font-semibold text-gray-900 ml-2">${selectedOrder.sum_price}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ml-2 ${getPaymentStatusColor(selectedOrder.payment)}`}>
                        {selectedOrder.message || getpaymentStatusText(selectedOrder.payment)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                {/* <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Status</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ml-2 ${getStatusConfirmedColor(selectedOrder.status_confirm)}`}>
                        {selectedOrder.message || getStatusConfirmedText(selectedOrder.status_confirm)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <span className="text-sm text-gray-900 ml-2">{formatDateTime(selectedOrder.created_at)}</span>
                    </div>
                  </div>
                </div> */}
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                {selectedOrder.status_confirm === 2 && (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.number_order, 1);
                        setShowOrderModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.number_order, 2);
                        setShowOrderModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 