'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import Link from 'next/link';
const API_BASE_URL = process.env.API_BASE_URL;
// Helper function to ensure scalar values
const ensureScalarValue = (value, defaultValue = '') => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return String(value);
};

export default function EditMuseumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const API_BASE_URL = process.env.API_BASE_URL;
  const [formData, setFormData] = useState({
    id: '',
    hotel_id: '',
    room_code: '',
    name: '',
    type: '',
    category: 'museum',
    phone_number: '',
    email: '',
    all_room: '',
    remaining_rooms: '',
    url: '',
    number_guests: '',
    opening_hours: '',
    adult_price: '',
    child_price: '',
    address: '',
    facilities: '',
    detail: '',
    status: 1
  });

  // Fetch museum data on component mount
  useEffect(() => {
    if (user && user.hotel_id && params.id) {
      fetchMuseumData();
    }
  }, [user, params.id]);

  const fetchMuseumData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching museum data for ID:', params.id);
      
      // Fetch museum data using hotel_id
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/room/${user.hotel_id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const museums = Array.isArray(result.data) ? result.data : [];
      
      console.log('All data from API:', museums);
      
      // Find the specific museum by ID
      const museum = museums.find(m => 
        (m.id == params.id || m.hotels_plans_id == params.id) && 
        m.category === 'museum'
      );
      
      console.log('Found museum:', museum);
      
      if (!museum) {
        showErrorAlert('Museum not found');
        router.push('/');
        return;
      }

      // Populate form data with proper fallbacks
      const formDataToSet = {
        id: ensureScalarValue(museum.id || museum.hotels_plans_id),
        hotel_id: user.hotel_id,
        room_code: ensureScalarValue(museum.room_code),
        name: ensureScalarValue(museum.room_name || museum.name),
        type: ensureScalarValue(museum.room_type || museum.type),
        category: 'museum',
        phone_number: ensureScalarValue(museum.phone_number),
        email: ensureScalarValue(museum.email),
        all_room: ensureScalarValue(museum.all_room),
        remaining_rooms: ensureScalarValue(museum.remaining_rooms),
        url: ensureScalarValue(museum.url),
        number_guests: ensureScalarValue(museum.number_guests),
        opening_hours: ensureScalarValue(museum.opening_hours),
        adult_price: ensureScalarValue(museum.adult_price),
        child_price: ensureScalarValue(museum.child_price),
        address: ensureScalarValue(museum.address),
        facilities: ensureScalarValue(museum.facilities),
        detail: ensureScalarValue(museum.detail),
        status: museum.status !== undefined && museum.status !== null ? Number(museum.status) : 1
      };
      
      setFormData(formDataToSet);
      
      // Fetch room types after setting form data
      if (formDataToSet.type) {
        fetchRoomTypes(formDataToSet.type);
      }
      
    } catch (error) {
      console.error('Error fetching museum data:', error);
      showErrorAlert('Failed to load museum data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async (roomTypeId) => {
    try {
      setIsLoadingTypes(true);
      
      // เพิ่ม timeout สำหรับ API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/type`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Room types API endpoint not found, using default types');
          // ใช้ default types แทน
          setRoomTypes([
            { id: 1, name: 'Hotel' },
            { id: 2, name: 'Deluxe' },
            { id: 3, name: 'Suite' },
            { id: 4, name: 'Presidential' },
            { id: 5, name: 'Family' }
          ]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setRoomTypes(result.data[0]);
      } else {
        console.warn('No room types data in API response, using default types');
        setRoomTypes([
          { id: 1, name: 'Standard' },
          { id: 2, name: 'Deluxe' },
          { id: 3, name: 'Suite' },
          { id: 4, name: 'Presidential' },
          { id: 5, name: 'Family' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
      
      // จัดการ timeout error
      if (error.name === 'AbortError') {
        console.warn('Room types API request timed out, using default types');
      }
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
console.log('formDataUpdate: ',formData);
    try {
      // API call to update museum
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/updatemuseum`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showSuccessAlert('Museum updated successfully!');
      
      // Redirect back to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating museum:', error);
      showErrorAlert('Failed to update museum. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading museum data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Component */}
      {alert.show && (
        <div className="fixed top-4 right-4 z-50">
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Edit Museum</h1>
            <Link 
              href="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900">Museum Information</h2>
              <p className="text-sm text-gray-600 mt-1">Update museum details</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Museum Code *</label>
                    <input
                      type="text"
                      name="room_code"
                      value={formData.room_code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="museum_code"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Museum Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Museum Name"
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="museum@example.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                    placeholder="Museum address"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Website URL</label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                    placeholder="https://museum-website.com"
                  />
                </div>

                {/* Opening Hours */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Opening Hours</label>
                  <input
                    type="text"
                    name="opening_hours"
                    value={formData.opening_hours}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                    placeholder="9:00 AM - 5:00 PM, Monday to Sunday"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Adult Price</label>
                    <input
                      type="number"
                      name="adult_price"
                      value={formData.adult_price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="25"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Child Price</label>
                    <input
                      type="number"
                      name="child_price"
                      value={formData.child_price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="15"
                    />
                  </div>
                </div>

                {/* Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Total Capacity</label>
                    <input
                      type="number"
                      name="all_room"
                      value={formData.all_room}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Available Capacity</label>
                    <input
                      type="number"
                      name="remaining_rooms"
                      value={formData.remaining_rooms}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Max Guests per Visit</label>
                    <input
                      type="number"
                      name="number_guests"
                      value={formData.number_guests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Facilities and Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Facilities</label>
                    <input
                      type="text"
                      name="facilities"
                      value={formData.facilities}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Parking, Cafe, Gift Shop"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 transition-colors"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                  <textarea
                    name="detail"
                    value={formData.detail}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                    placeholder="Describe the museum, its exhibits, and special features..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link
                    href="/"
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Museum'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 