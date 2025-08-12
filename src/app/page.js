'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { useLanguage } from './components/LanguageProvider';
import { getCookie } from './utils/cookies';

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

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // เพิ่ม state สำหรับเก็บข้อมูลต้นฉบับ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [facilitiesList, setFacilitiesList] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteItemName, setDeleteItemName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('hotel');
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const API_BASE_URL = process.env.API_BASE_URL;

  // Fetch data from API
  useEffect(() => {
    if (user && user.hotel_id) {
      fetchData();
      fetchFacilities();
    } else if (user === null || (user && !user.hotel_id)) {
      // ถ้าไม่มี user หรือไม่มี hotel_id ให้ redirect ไปหน้า login
      router.push('/login');
    }
  }, [user, router]);

  const fetchData = async () => {
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
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/room/${user.hotel_id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Room API endpoint not found, using demo data');
          // ใช้ demo data แทน
          const demoData = [
            {
              id: null,
              hotels_plans_id: null,
              room_code: null,
              room_name: null,
              room_type: null,
              category: null,
              facilities: null,
              detail: null,
              price: null,
              number_beds: null,
              number_guests: null,
              all_room: null,
              remaining_rooms: null,
              status: 0
            }
          ];
          setData(demoData);
          setOriginalData(demoData); // บันทึกข้อมูลต้นฉบับ
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('result', result);
      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
        setOriginalData(result.data); // บันทึกข้อมูลต้นฉบับ
      } else {
        console.warn('Invalid data format, using empty array');
        setData([]);
        setOriginalData([]); // บันทึกข้อมูลต้นฉบับ
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError('Failed to fetch data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/facilities`);
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setFacilitiesList(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const handleEdit = (id, category) => {
    if (category === 'museum') {
      router.push(`/edit-museum/${id}`);
    } else {
      router.push(`/edit/${id}`);
    }
  };

  const showSuccessAlert = (message) => {
    setAlert({ show: true, message, type: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const showErrorAlert = (message) => {
    setAlert({ show: true, message, type: 'error' });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const handleDelete = (id) => {
    const item = data.find(item => (item.hotels_plans_id || item.id) === id);
    if (!item) {
      showErrorAlert('Item not found');
      return;
    }
    setDeleteItemId(id);
    setDeleteItemName(item.room_name || item.name || 'Unknown');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    
    // Check if user is authenticated
    if (!user || !user.hotel_id) {
      showErrorAlert('Please login again to perform this action');
      return;
    }
    
    setIsDeleting(true);
    try {
      // Try multiple delete endpoints in case one doesn't work
      const endpoints = [
        `${API_BASE_URL}/api/hotels/backoffice/deleteroom/${deleteItemId}`,
      ];
      
      let success = false;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying delete endpoint: ${endpoint}`);
          const token = getCookie('authToken');
          const headers = {
            'Content-Type': 'application/json',
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Delete result:', result);
            showSuccessAlert('Room deleted successfully');
            // Update the data by filtering out the deleted item
            setData(prevData => prevData.filter(item => (item.hotels_plans_id || item.id) !== deleteItemId));
            setOriginalData(prevData => prevData.filter(item => (item.hotels_plans_id || item.id) !== deleteItemId));
            success = true;
            break;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.log(`Delete failed for ${endpoint}:`, errorData, 'Status:', response.status);
            lastError = { ...errorData, status: response.status, endpoint };
          }
        } catch (error) {
          console.log(`Error with endpoint ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      if (!success) {
        console.error('All delete endpoints failed:', lastError);
        const errorMessage = lastError?.message || 
          (lastError?.status === 404 ? 'Room not found' : 
           lastError?.status === 401 ? 'Unauthorized - Please login again' :
           lastError?.status === 403 ? 'Forbidden - You do not have permission' :
           'All delete methods failed');
        showErrorAlert(`Failed to delete room: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      showErrorAlert('Failed to delete room. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteItemId(null);
      setDeleteItemName('');
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      let filteredData = [...originalData]; // ใช้ originalData เป็นข้อมูลต้นฉบับ
      
      // ตรวจสอบว่ามีการค้นหาหรือไม่
      const hasSearchCriteria = searchId.trim() || searchName.trim() || searchCategory.trim();
      
      if (hasSearchCriteria) {
        // Filter by Room ID/Code
        if (searchId && searchId.trim()) {
          filteredData = filteredData.filter(item => 
            item.room_code && item.room_code.toString().toLowerCase().includes(searchId.toLowerCase().trim())
          );
        }
        
        // Filter by Room Name
        if (searchName && searchName.trim()) {
          filteredData = filteredData.filter(item => 
            item.room_name && item.room_name.toLowerCase().includes(searchName.toLowerCase().trim())
          );
        }
        
        // Filter by Category
        if (searchCategory && searchCategory.trim()) {
          filteredData = filteredData.filter(item => 
            item.category && item.category.toLowerCase() === searchCategory.toLowerCase().trim()
          );
        }
        
        // แสดงผลการค้นหา
        showSuccessAlert(`Found ${filteredData.length} room(s) matching your search criteria`);
      } else {
        // ถ้าไม่มีเงื่อนไขการค้นหา ให้แสดงข้อมูลทั้งหมด
        showSuccessAlert('Showing all rooms');
      }
      
      setData(filteredData);
      setIsSearching(false);
    }, 500);
  };

  const handleReset = () => {
    setSearchId('');
    setSearchName('');
    setSearchCategory('');
    // ใช้ข้อมูลต้นฉบับแทนการเรียก API ใหม่
    setData([...originalData]);
    showSuccessAlert('Search filters have been reset');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-responsive-base">{t('loadingData')}</p>
        </div>
      </div>
    );
  }

  if (!user || !user.hotel_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <p className="text-gray-600 mb-4 text-responsive-base">{t('errorLoadingData')}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-target-responsive"
          >
            {t('dashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <p className="text-gray-600 mb-4 text-responsive-base">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-target-responsive"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <style dangerouslySetInnerHTML={{ __html: fadeInAnimation }} />
      
      {/* Alert Component */}
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full mx-4 sm:mx-0" style={{
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div className={`rounded-lg shadow-lg p-4 ${
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
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setAlert({ show: false, message: '', type: '' })}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-target-responsive ${
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
        <div className="container-responsive">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/profile"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors touch-target-responsive">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive py-4 sm:py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 card-responsive mb-8">
          <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('search')}</h2>
                <p className="text-sm text-gray-600 mt-1">ค้นหาห้องพักตามเงื่อนไขที่ต้องการ</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex w-full space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2">{t('searchByCode')}</label>
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-800 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="room ID"
                />
              </div>
              <div className="flex items-end w-48">
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('loadingData')}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {t('search')}
                    </div>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-6 button-group-responsive">
              <button
                onClick={handleReset}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('reset')}
              </button>
              <Link
                href="/add"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-center transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('addStock')}
              </Link>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {data.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('searchResults')}</h2>
                    <p className="text-sm text-gray-600 mt-1">แสดงผลการค้นหาห้องพักทั้งหมด</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {data.length} รายการ
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              {data.map((item, index) => (
                <div key={item.id || index} className="border-b border-gray-100 p-6 hover:bg-gray-50 transition-colors">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.room_name || '-'}</h3>
                        <p className="text-sm text-gray-600">
                          Code: {item.room_code ? (
                            <Link 
                              href={`/room/${item.room_code}?hotels_plans_id=${item.hotels_plans_id || item.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                            >
                              {item.room_code}
                            </Link>
                          ) : '-'}
                        </p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        item.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 1 ? t('open') : t('close')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 font-medium">{t('category')}:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{item.category || '-'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 font-medium">Type:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{item.room_type || '-'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 font-medium">{t('price')}:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{item.price ? `¥${item.price}` : '-'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 font-medium">{t('beds')}:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{item.number_beds || '-'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 font-medium">{t('guests')}:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{item.number_guests || '-'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 font-medium">{t('total')}:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{item.all_room || '-'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 font-medium">{t('vacant')}:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{item.remaining_rooms || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <button 
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleEdit(item.hotels_plans_id || item.id, item.category)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {t('edit')}
                      </button>
                      <button 
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleDelete(item.hotels_plans_id || item.id)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block table-responsive">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('roomCode')}
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('roomType')}
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('category')}
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('guests')}
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('beds')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('price')}
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('totalRooms')}
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('availableRooms')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('setting')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.room_code ? (
                          <Link 
                            href={`/room/${item.room_code}?hotels_plans_id=${item.hotels_plans_id || item.id}&all_room=${item.all_room}`}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                          >
                            {item.room_code}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.room_type || '-'}</td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category || '-'}</td>
                      <td className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.number_guests || '-'}</td>
                      <td className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.number_beds || '-'}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.price ? `¥${item.price}` : '-'}</td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.all_room || '-'}</td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remaining_rooms || '-'}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 1 ? t('Available') : t('Unavailable')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors touch-target-responsive"
                            onClick={() => handleEdit(item.hotels_plans_id || item.id, item.category)}
                          >
                            {t('edit')}
                          </button>
                          <button 
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors touch-target-responsive"
                            onClick={() => handleDelete(item.hotels_plans_id || item.id)}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{t('confirmDelete')}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {t('deleteConfirmation')}
                </p>
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-sm font-semibold text-gray-900 truncate">{deleteItemName}</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 text-sm"
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('loadingData')}
                    </div>
                  ) : (
                    t('delete')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
} 