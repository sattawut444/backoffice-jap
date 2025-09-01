'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useLanguage } from '../../components/LanguageProvider';

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
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const room_code = params.room_code;
  // const hotels_plans_id = searchParams.get('hotels_plans_id'); 
  // รับค่า all_room ที่ส่งมา
  // const all_room = searchParams.get('all_room');
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [deletingItem, setDeletingItem] = useState({});
  const [selectedView, setSelectedView] = useState('cards'); // 'cards' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchOpeningDays, setSearchOpeningDays] = useState(''); // เพิ่ม state สำหรับ search opening days
  const [searchEndDate, setSearchEndDate] = useState(''); // เพิ่ม state สำหรับวันที่สิ้นสุด
  const [showCalendar, setShowCalendar] = useState(false); // เพิ่ม state สำหรับแสดง calendar
  const { user } = useAuth();
  const { t } = useLanguage();
  const API_BASE_URL = process.env.API_BASE_URL;
  // รับค่า hotels_plans_id และ all_room จาก URL search params
  const hotels_plans_id = searchParams.get('hotels_plans_id');
  const all_room = searchParams.get('all_room');

  useEffect(() => {
    if (room_code) {
      fetchRoomData();
    }
  }, [room_code]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("user.hotel_id: ",user.hotel_id)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      // console.log("all_rooms: ",all_room)
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/roomlist?room_code=${room_code}&hotel_id=${user.hotel_id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
             if (!response.ok) {
         if (response.status === 404) {
           console.warn('Room detail API endpoint not found, using demo data');
           setRoomData([]);
           return;
         }
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const result = await response.json();
       
       // Handle different response formats and get all data
       let allRoomData = [];
       
       if (result.data) {
         // If result has a data property
         if (Array.isArray(result.data)) {
           // If data is an array, use all data
           allRoomData = result.data;
         } else {
           // If data is a single object, convert to array
           allRoomData = [result.data];
         }
       } else if (Array.isArray(result)) {
         // If result is directly an array
         allRoomData = result;
       } else if (result) {
         // If result is a single object, convert to array
         allRoomData = [result];
       }
       
       if (allRoomData.length > 0) {
         setRoomData(allRoomData);
       } else {
         console.warn('No room data found');
         setError('No room data found');
       }
    } catch (error) {
      console.error('Error fetching room data:', error);
             if (error.name === 'AbortError') {
         console.warn('Room detail API request timed out, using demo data');
         setRoomData([]);
      } else {
        setError('Failed to fetch room data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [itemId]: true }));
      
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/editstockstatus`, {
        method: 'put',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotel_stock_id: itemId,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Show success message (you can add a toast notification here)
      alert('Status updated successfully!');
      
      // Refresh the data to get the updated values
      await fetchRoomData();
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDelete = async (hotelStockId) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setDeletingItem(prev => ({ ...prev, [hotelStockId]: true }));
      
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/deletestock/${hotelStockId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete result:', result);

      // Show success message
      alert('Item deleted successfully!');
      
      // Refresh the data to get the updated list
      await fetchRoomData();
      
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeletingItem(prev => ({ ...prev, [hotelStockId]: false }));
    }
  };

  // Filter rooms based on status and opening days search
  const filteredRooms = roomData.filter(room => {
    // Filter by status
    if (filterStatus === 'all') {
      // No status filter
    } else if (filterStatus === 'Available') {
      if (room.status !== 1) return false;
    } else if (filterStatus === 'Unavailable') {
      if (room.status !== 0) return false;
    }
    
    // Filter by opening days search
    if (searchOpeningDays.trim() !== '' || searchEndDate.trim() !== '') {
      // ถ้ามีการเลือกช่วงวันที่
      if(searchOpeningDays.trim() !== '' && searchEndDate.trim() !== ''){
        // กรณีเลือกหลายวัน
        if(room.day_use >= searchOpeningDays && room.day_use <= searchEndDate){
          return true;
        }else{
          return false;
        }
      } else if (searchEndDate.trim() !== '') {
        // กรณีเลือกวันที่น้อยกว่าวัน End Day
        if(room.day_use <= searchEndDate){
          return true;
        }else{
          return false;
        }
      } else {
        // กรณีเลือกวันที่เดียว
        if(room.day_use === searchOpeningDays){
          return true;
        }else{
          return false;
        }
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingRoomDetails')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchRoomData}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
      
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-white to-blue-50 shadow-sm border-b border-blue-100 lg:hidden">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.back()}
                  className="p-2.5 rounded-xl bg-white shadow-sm hover:bg-blue-50 hover:shadow-md transition-all duration-200 border border-blue-100"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">{t('roomDetails')}</h1>
                    <p className="text-xs text-gray-600 font-medium">{t('roomCode')}: <span className="text-blue-600 font-bold">{room_code}</span></p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    showFilters 
                      ? 'bg-blue-100 text-blue-600 shadow-md' 
                      : 'bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                <Link 
                  href={`/add-stock?hotels_plans_id=${hotels_plans_id || ''}`}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="bg-gradient-to-r from-white to-blue-50 shadow-sm border-b border-blue-100 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">Room Details</h1>
                    <span className="text-sm text-gray-600 font-medium">Room Code: <span className="text-blue-600 font-bold">{room_code}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/add-stock?hotels_plans_id=${hotels_plans_id || ''}&all_room=${all_room}`}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{t('addStock')}</span>
                </Link>
                <Link 
                  href="/"
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>{t('backToDashboard')}</span>
                </Link>
                <Link 
                  href="/profile"
                  className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Search and Filters */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                {/* Status Filter */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {t('status')}:
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm bg-white border-2 border-blue-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-blue-300 transition-all duration-200 text-black"
                  >
                    <option value="all">{t('allRooms')}</option>
                    <option value="Available">{t('Available')}</option>
                    <option value="Unavailable">{t('Unavailable')}</option>
                  </select>
                </div>
                
                {/* Opening Days Search */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Start Date:
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative group">
                                          <input
                      type="date"
                      value={searchOpeningDays}
                      onChange={(e) => setSearchOpeningDays(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className={`w-48 text-sm rounded-xl pl-12 pr-12 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 group-hover:shadow-md ${
                        searchOpeningDays 
                          ? 'bg-indigo-50 border-2 border-indigo-400 text-black font-semibold shadow-md' 
                          : 'bg-white border-2 border-indigo-200 hover:border-indigo-300 text-black'
                      }`}
                    />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className={`h-5 w-5 transition-colors ${searchOpeningDays ? 'text-indigo-600' : 'text-indigo-400 group-hover:text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {searchOpeningDays && (
                        <button
                          onClick={() => setSearchOpeningDays('')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <span className="text-black font-medium">End Date:</span>
                    
                    <div className="relative group">
                                          <input
                      type="date"
                      value={searchEndDate}
                      onChange={(e) => setSearchEndDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      min={searchOpeningDays}
                      className={`w-48 text-sm rounded-xl pl-12 pr-12 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 group-hover:shadow-md ${
                        searchEndDate 
                          ? 'bg-indigo-50 border-2 border-indigo-400 text-black font-semibold shadow-md' 
                          : 'bg-white border-2 border-indigo-200 hover:border-indigo-300 text-black'
                      }`}
                    />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className={`h-5 w-5 transition-colors ${searchEndDate ? 'text-indigo-600' : 'text-indigo-400 group-hover:text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {searchEndDate && (
                        <button
                          onClick={() => setSearchEndDate('')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Results Count */}
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-100">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {t('showing')} <span className="text-blue-600 font-bold">{filteredRooms.length}</span> {t('of')} <span className="text-gray-900 font-bold">{roomData.length}</span> {t('rooms')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="bg-gradient-to-b from-blue-50 to-indigo-50 border-b border-blue-100 lg:hidden animate-slideIn">
            <div className="px-4 py-4 space-y-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {t('filter')}:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full text-sm bg-white border-2 border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-blue-300 transition-all duration-200"
                >
                  <option value="all">{t('allRooms')}</option>
                  <option value={1}>Available</option>
                  <option value={0}>Unavailable</option>
                </select>
              </div>
              
              {/* Results Count */}
              <div className="flex items-center justify-center space-x-2 bg-white px-4 py-3 rounded-xl shadow-sm border border-blue-100">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {t('showing')} <span className="text-blue-600 font-bold">{filteredRooms.length}</span> {t('of')} <span className="text-gray-900 font-bold">{roomData.length}</span> {t('rooms')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* Desktop Stats */}
          <div className={`hidden lg:grid gap-6 mb-8 lg:grid-cols-3`}>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{filteredRooms.length}</div>
                  <div className="text-sm text-gray-500">{t('totalRooms')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredRooms.filter(room => room.status === 1).length}
                  </div>
                  <div className="text-sm text-gray-500">{t('openRooms')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredRooms.filter(room => room.status === 0).length}
                  </div>
                  <div className="text-sm text-gray-500">{t('closedRooms')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                  {t('roomInformation')} ({filteredRooms.length} rooms)
                </h2>
                <div className="flex items-center space-x-2">
                  {/* View Toggle - Mobile */}
                  <div className="flex lg:hidden bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setSelectedView('cards')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        selectedView === 'cards' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t('cards')}
                    </button>
                    <button
                      onClick={() => setSelectedView('list')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        selectedView === 'list' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t('list')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Card View */}
            {selectedView === 'cards' && (
              <div className="block lg:hidden">
                {filteredRooms.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500">No rooms found</p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {filteredRooms.map((item, index) => (
                      <div 
                        key={item.id || index} 
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow animate-fadeIn"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-base">{item.room_name || item.room_type || '-'}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {t('roomCode')}: <span className="text-blue-600 font-medium">{item.room_code || '-'}</span>
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusUpdate(item.hotel_stock_id, parseInt(e.target.value))}
                                disabled={updatingStatus[item.hotel_stock_id]}
                                className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                  item.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                } ${updatingStatus[item.hotel_stock_id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <option value={1}>Available</option>
                                <option value={0}>Unavailable</option>
                              </select>
                              {updatingStatus[item.hotel_stock_id] && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="text-gray-500">{t('category')}:</span>
                              <span className="text-gray-900 font-medium">{item.category || '-'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="text-gray-500">{t('price')}:</span>
                              <span className="text-gray-900 font-medium">{item.price ? `¥${item.price}` : '-'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                              </svg>
                              <span className="text-gray-500">{t('beds')}:</span>
                              <span className="text-gray-900 font-medium">{item.number_beds || '-'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="text-gray-500">{t('guests')}:</span>
                              <span className="text-gray-900 font-medium">{item.number_guests || '-'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-gray-500">{t('total')}:</span>
                              <span className="text-gray-900 font-medium">{item.all_room || '-'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-500">{t('vacant')}:</span>
                              <span className="text-gray-900 font-medium">{item.remaining_rooms || '-'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-500">{t('openingDays')}:</span>
                              <span className="text-gray-900 font-medium">{item.day_use || '-'}</span>
                            </div>
                          </div>
                          
                          {(item.facilities || item.detail) && (
                            <div className="pt-2 border-t border-gray-100">
                              {item.facilities && (
                                <div className="text-sm mb-2">
                                  <span className="text-gray-500">{t('facilities')}:</span>
                                  <span className="ml-1 text-gray-900">{item.facilities}</span>
                                </div>
                              )}
                              {item.detail && (
                                <div className="text-sm">
                                  <span className="text-gray-500">{t('details')}:</span>
                                  <span className="ml-1 text-gray-900">{item.detail}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex space-x-2 pt-2 border-t border-gray-100">
                            <Link
                              href={`/edit-stock/${item.hotel_stock_id}?room_code=${room_code}&hotels_plans_id=${hotels_plans_id}`}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {t('edit')}
                            </Link>
                            <button
                              onClick={() => handleDelete(item.hotel_stock_id)}
                              disabled={deletingItem[item.hotel_stock_id]}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingItem[item.hotel_stock_id] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              ) : (
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mobile List View */}
            {selectedView === 'list' && (
              <div className="block lg:hidden">
                {filteredRooms.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500">No rooms found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredRooms.map((item, index) => (
                      <div 
                        key={item.id || index} 
                        className="p-4 hover:bg-gray-50 transition-colors animate-fadeIn"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-3 h-3 rounded-full ${item.status === 1 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.room_name || item.room_type || '-'}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {item.room_code || '-'} • {item.category || '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900 font-medium">
                              ¥{item.price || '-'}
                            </span>
                            <Link
                              href={`/edit-stock/${item.hotel_stock_id}?room_code=${room_code}&hotels_plans_id=${hotels_plans_id}`}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(item.hotel_stock_id)}
                              disabled={deletingItem[item.hotel_stock_id]}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                            >
                              {deletingItem[item.hotel_stock_id] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Room code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Opening days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Room name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      All Rooms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('inuse')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Available Rooms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Number of beds
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Number of guests
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
                   {filteredRooms.map((item, index) => (
                     <tr key={item.id || index} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         <span className="text-blue-600 font-medium">{item.room_code || '-'}</span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.day_use || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.room_type || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock|| '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.in_use || 0}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.available_room || 0}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.number_beds || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.number_guests || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center space-x-2">
                           <select
                             value={item.status}
                             onChange={(e) => handleStatusUpdate(item.hotel_stock_id, parseInt(e.target.value))}
                             disabled={updatingStatus[item.hotel_stock_id]}
                             className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                               item.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                             } ${updatingStatus[item.id || item.hotels_plans_id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                           >
                             <option value={1}>Available</option>
                             <option value={0}>Unavailable</option>
                           </select>
                           {updatingStatus[item.id || item.hotels_plans_id] && (
                             <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                           )}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <div className="flex items-center space-x-2">
                           <Link
                             href={`/edit-stock/${item.hotel_stock_id}?room_code=${room_code}&hotels_plans_id=${hotels_plans_id}&day_use=${item.day_use}&stock=${item.stock}&all_room=${item.all_room}`}
                             className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                           >
                             <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                             </svg>
                             Edit
                           </Link>
 
                           <button
                             onClick={() => handleDelete(item.hotel_stock_id)}
                             disabled={deletingItem[item.hotel_stock_id]}
                             className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {deletingItem[item.hotel_stock_id] ? (
                               <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                             ) : (
                               <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                             )}
                             Delete
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 