'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { setCookie, getCookie, removeCookie } from '../utils/cookies';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // ฟังก์ชันตรวจสอบ token ในคุกกี้
  const checkTokenInCookies = () => {
    const token = getCookie('authToken');
    const userData = getCookie('user');
    
    if (token && userData) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userData));
        
        // ตรวจสอบว่า token ไม่ใช่ demo token
        if (token.startsWith('demo-jwt-token-')) {
          console.log('Demo token detected, clearing authentication');
          removeCookie('authToken');
          removeCookie('user');
          setIsAuthenticated(false);
          setUser(null);
          return false;
        }
        
        // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
        if (!userObj.email || !userObj.hotel_id) {
          console.log('Incomplete user data, clearing authentication');
          removeCookie('authToken');
          removeCookie('user');
          setIsAuthenticated(false);
          setUser(null);
          return false;
        }
        
        setIsAuthenticated(true);
        setUser(userObj);
        
        // ดึงข้อมูล profile จาก API (ใช้ hotel_id แทน id)
        if (userObj.hotel_id) {
          fetchProfile(userObj.hotel_id);
        }
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        removeCookie('authToken');
        removeCookie('user');
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    // ตรวจสอบ token ในคุกกี้เมื่อเข้าเว็บ
    const hasValidToken = checkTokenInCookies();
    setIsLoading(false);
    
    // ถ้าไม่มี token และไม่ได้อยู่ที่หน้า login หรือ forgot-password ให้ redirect
    if (!hasValidToken && pathname !== '/login' && pathname !== '/forgot-password') {
      router.push('/login');
    }
  }, []);

  // เพิ่ม fallback mechanism สำหรับกรณีที่ API ไม่ทำงาน
  const checkApiHealth = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 วินาที timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('API server may not be running:', error);
      return false;
    }
  };

  const fetchProfile = async (userId) => {
    try {
      // ใช้ hotel_id แทน userId และเพิ่ม error handling ที่ดีขึ้น
      const hotelId = user?.hotel_id || userId;
      
      if (!hotelId) {
        console.log('No hotel_id found, skipping profile fetch');
        return;
      }
      
      // ตรวจสอบว่า API server ทำงานอยู่หรือไม่
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        console.log('API server not available, skipping profile fetch');
        return;
      }
      
      // เพิ่ม timeout เพื่อป้องกันการรอนานเกินไป
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 วินาที timeout
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/profile/${hotelId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Profile API returned ${response.status}, skipping profile update`);
        return; // ไม่ throw error เพื่อไม่ให้กระทบการ login
      }
      
      const result = await response.json();
      console.log('Profile API Response:', result);
      
      if (result.data) {
        // อัพเดทข้อมูล user ด้วยข้อมูลจาก profile API
        setUser(prevUser => ({
          ...prevUser,
          ...result.data
        }));
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Profile API request timed out, skipping profile update');
      } else {
        console.warn('Error fetching profile (non-critical):', error);
      }
      // ไม่ต้องทำอะไรถ้า fetch profile ไม่สำเร็จ - ไม่กระทบการ login
    }
  };

  useEffect(() => {
    // ถ้าไม่ได้ login และไม่ได้อยู่ที่หน้า login หรือ forgot-password ให้ redirect
    if (!isLoading && !isAuthenticated && pathname !== '/login' && pathname !== '/forgot-password') {
      router.push('/login');
    }
    
    // ถ้า login แล้วและอยู่ที่หน้า login ให้ redirect ไปหน้า dashboard
    if (!isLoading && isAuthenticated && pathname === '/login') {
      router.push('/');
    }
  }, [isAuthenticated, pathname, isLoading, router]);

  const login = (email, password, token, userData) => {
    if (token && userData) {
      // ตรวจสอบว่า token ไม่ใช่ demo token
      if (token.startsWith('demo-jwt-token-')) {
        console.error('Demo token not allowed for production login');
        return false;
      }
      
      // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
      if (!userData.email || !userData.hotel_id) {
        console.error('Incomplete user data for login');
        return false;
      }
      
      // เก็บ token และข้อมูล user ใน cookie
      setCookie('authToken', token, 1); // เก็บไว้ 1 วัน
      setCookie('user', encodeURIComponent(JSON.stringify(userData)), 1);
      
      setIsAuthenticated(true);
      setUser(userData);
      
      // ดึงข้อมูล profile จาก API (ใช้ hotel_id แทน id)
      if (userData.hotel_id) {
        fetchProfile(userData.hotel_id);
      }
      
      return true;
    }
    return false;
  };

  const logout = () => {
    removeCookie('authToken');
    removeCookie('user');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 