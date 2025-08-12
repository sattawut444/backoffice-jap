'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const [orderCounts, setOrderCounts] = useState({
    total: 0,
    confirmed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isActive = (path) => {
    return pathname === path;
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch order counts
  useEffect(() => {
    if (user && user.hotel_id) {
      fetchOrderCounts();
    }
  }, [user]);
  const fetchOrderCounts = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      
      // Fetch total orders
      const totalResponse = await fetch(`${API_BASE_URL}/api/hotels/backoffice/order/${user.hotel_id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET'
      });
      
      // Fetch confirmed orders
      const confirmedResponse = await fetch(`${API_BASE_URL}/api/hotels/backoffice/orderconfirm/${user.hotel_id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET'
      });
      
      // Fetch cancelled orders
      const cancelledResponse = await fetch(`${API_BASE_URL}/api/hotels/backoffice/ordercancelled/${user.hotel_id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET'
      });

      let totalCount = 0;
      let confirmedCount = 0;
      let cancelledCount = 0;

      // Process total orders
      if (totalResponse.ok) {
        const totalData = await totalResponse.json();
        if (Array.isArray(totalData.data)) {
          totalCount = totalData.data.length;
        }
      }

      // Process confirmed orders
      if (confirmedResponse.ok) {
        const confirmedData = await confirmedResponse.json();
        if (Array.isArray(confirmedData.data)) {
          confirmedCount = confirmedData.data.length;
        }
      }

      // Process cancelled orders
      if (cancelledResponse.ok) {
        const cancelledData = await cancelledResponse.json();
        if (Array.isArray(cancelledData.data)) {
          cancelledCount = cancelledData.data.length;
        }
      }

      setOrderCounts({
        total: totalCount,
        confirmed: confirmedCount,
        cancelled: cancelledCount
      });
    } catch (error) {
      console.error('Error fetching order counts:', error);
      // Set default values if API fails
      setOrderCounts({
        total: 0,
        confirmed: 0,
        cancelled: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (href) => {
    // Close sidebar on mobile when navigating
    if (onClose) {
      onClose();
    }
    window.location.href = href;
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 shadow-lg">
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Close button and logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">HotelPro</h1>
              <p className="text-gray-300 text-xs">Management System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden touch-target-responsive text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          <button 
            onClick={() => handleNavigation('/hotel-profile')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/hotel-profile') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className={`text-sm ${isActive('/hotel-profile') ? 'font-semibold' : 'font-medium'}`}>{t('profile')}</span>
          </button>
          
          <button 
            onClick={() => handleNavigation('/')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            <span className={`text-sm ${isActive('/') ? 'font-semibold' : 'font-medium'}`}>{t('dashboard')}</span>
          </button>
          
          <button 
            onClick={() => handleNavigation('/add')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/add') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className={`text-sm ${isActive('/add') ? 'font-semibold' : 'font-medium'}`}>{t('addRoom')}</span>
          </button>

          {/* <button 
            onClick={() => handleNavigation('/add-stock')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/add-stock') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className={`text-sm ${isActive('/add-stock') ? 'font-semibold' : 'font-medium'}`}>{t('addStock')}</span>
          </button> */}

          <button 
            onClick={() => handleNavigation('/orders')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/orders') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className={`text-sm ${isActive('/orders') ? 'font-semibold' : 'font-medium'}`}>{t('orders')}</span>
            {!loading && (
              <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ml-2">
                {orderCounts.total}
              </span>
            )}
          </button>

          <button 
            onClick={() => handleNavigation('/confirmed-orders')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/confirmed-orders') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm ${isActive('/confirmed-orders') ? 'font-semibold' : 'font-medium'}`}>{t('confirmedOrders')}</span>
          </button>

          <button 
            onClick={() => handleNavigation('/reports')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/reports') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className={`text-sm ${isActive('/reports') ? 'font-semibold' : 'font-medium'}`}>{t('reports')}</span>
          </button>
          
          <button 
            onClick={() => handleNavigation('/settings')}
            className={`w-full flex items-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-all duration-200 touch-target-responsive ${
              isActive('/settings') 
                ? 'text-white bg-gray-700 border-l-4 border-white rounded-r-lg shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className={`text-sm ${isActive('/settings') ? 'font-semibold' : 'font-medium'}`}>{t('settings')}</span>
          </button>
        </nav>
        
        {/* User Info */}
        <div className="mt-6 pt-4 border-t border-gray-600/30">
          <div className="flex items-center p-3 bg-gray-700/30 rounded-lg mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-gray-600 text-xs sm:text-sm font-bold">A</span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-300 truncate">{user.email}</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={logout}
            className="w-full flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-gray-300 hover:bg-red-600/30 hover:text-white transition-all duration-200 touch-target-responsive"
          >
            <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 