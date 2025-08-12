'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import Link from 'next/link';
const API_BASE_URL = process.env.API_BASE_URL;
export default function AddMuseumPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Fetch room types when component mounts
  useEffect(() => {
    fetchRoomTypes();
  }, []);
  const [formData, setFormData] = useState({
    hotel_id: user.hotel_id,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchRoomTypes = async () => {
    try {
      setIsLoadingTypes(true);
      
      // เพิ่ม timeout สำหรับ API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call to add new museum
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/addmuseum`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Reset form
      setFormData({
        hotel_id: user.hotel_id,
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

      // Redirect back to home page
      router.push('/');
    } catch (error) {
      console.error('Error adding museum:', error);
      alert('Failed to add museum. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Add New Attraction</h1>
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
              <h2 className="text-xl font-bold text-gray-900">Attraction Information</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in all Attraction details completely</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Attraction Code *</label>
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
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Attraction Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="museum_name"
                      required
                    />
                  </div>
                </div>

                {/* Museum Type and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-semibold text-gray-800 mb-2">Attraction Type *</label>
                     <select
                       name="type"
                       value={formData.type}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-colors"
                       required
                       disabled={isLoadingTypes}
                     >
                       <option value="">{isLoadingTypes ? 'Loading Attraction types...' : 'Select Attraction Type'}</option>
                       {roomTypes.map((type) => (
                         <option key={type.id} value={type.id}>
                           {type.name}
                         </option>
                       ))}
                     </select>
                     {isLoadingTypes && (
                       <div className="mt-2 flex items-center text-sm text-gray-500">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                         Loading Attraction types...
                       </div>
                     )}
                     <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">Need a new attraction type?</p>
                        <Link
                          href="/add-type?from=add-museum"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Create New Type
                        </Link>
                      </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="phone_number"
                      required
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
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Website and Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Website</label>
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Google Map Link</label>
                    <input
                      type="url"
                      name="url_google_map"
                      value={formData.url_google_map}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>

                {/* Opening Hours and Admission Fees */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Opening Hours *</label>
                    <input
                      type="text"
                      name="opening_hours"
                      value={formData.opening_hours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="9:00 AM - 5:00 PM"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Adult Price *</label>
                    <input
                      type="number"
                      name="adult_price"
                      value={formData.adult_price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Adult price"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Child Price *</label>
                    <input
                      type="number"
                      name="child_price"
                      value={formData.child_price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Child price"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors resize-none"
                    placeholder="Complete museum address including street, city, province, postal code..."
                    rows={3}
                    required
                  />
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Facilities *</label>
                  <input
                    type="text"
                    name="facilities"
                    value={formData.facilities}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors"
                    placeholder="Parking, Cafe, Gift Shop, Guided Tours, etc."
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 transition-colors"
                    required
                  >
                    <option value={1}>Open</option>
                    <option value={0}>Closed</option>
                  </select>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Additional Details</label>
                  <textarea
                    name="detail"
                    value={formData.detail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 placeholder-gray-500 transition-colors resize-none"
                    placeholder="Additional museum details such as special exhibitions, collections, accessibility features, parking information..."
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link
                    href="/"
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </div>
                    ) : (
                      'Add Museum'
                    )}
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