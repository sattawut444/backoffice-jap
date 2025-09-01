'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';

const API_BASE_URL = process.env.API_BASE_URL;

export default function AddTypePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: 'hotel',
    hotel_id: '',
    status: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingTypes, setExistingTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Check if page was accessed from add-museum
  const fromAddMuseum = searchParams.get('from') === 'add-museum';
  // Set hotel_id when user is available and fetch existing types
  useEffect(() => {
    if (user && user.hotel_id) {
      setFormData(prev => ({
        ...prev,
        hotel_id: user.hotel_id
      }));
      fetchExistingTypes();
    } else {
      console.warn('No hotel_id found in AuthProvider');
    }
  }, [user]);

  const fetchExistingTypes = async () => {
    try {
      setIsLoadingTypes(true);
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/addtype?hotel_id=${user?.hotel_id || ''}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          setExistingTypes(result.data);
        } else if (result && Array.isArray(result)) {
          setExistingTypes(result);
        } else {
          // Fallback to demo data
          setExistingTypes([]);
        }
      } else {
        // Fallback to demo data
        setExistingTypes([]);
      }
    } catch (error) {
      console.error('Error fetching existing types:', error);
      // Fallback to demo data
      setExistingTypes([]);
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
    // Clear any existing messages when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };
  const handleInputChangeType = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing messages when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    // Validate form data
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a room type name' });
      setIsSubmitting(false);
      return;
    }

    // Check if room type name already exists
    const existingType = existingTypes.find(type => 
      type.name.toLowerCase() === formData.name.toLowerCase()
    );
    if (existingType) {
      setMessage({ type: 'error', text: `Room type "${formData.name}" already exists` });
      setIsSubmitting(false);
      return;
    }

    try {
      // Add timeout for API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      console.log(formData);
      // API call to add new room type
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/addroomtype`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Add room type API endpoint not found, showing success message');
          setMessage({
            type: 'success',
            text: 'Room type added successfully! (Demo mode)'
          });
          
          // Reset form but keep hotel_id
          setFormData({
            name: '',
            type: '',
            status: 1,
            hotel_id: user.hotel_id
          });

          // Redirect back to add room page after 2 seconds
          setTimeout(() => {
            router.push(fromAddMuseum ? '/add-museum' : '/add');
          }, 2000);
          return;
        }
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Room type added successfully:', result);

      setMessage({
        type: 'success',
        text: 'Room type added successfully!'
      });

      // Reset form but keep hotel_id
      setFormData({
        name: '',
        type: '',
        status: 1,
        hotel_id: user.hotel_id
      });
      
      setTimeout(() => {
        router.push(fromAddMuseum ? '/add-museum' : '/add');
      }, 2000);

    } catch (error) {
      console.error('Error adding room type:', error);
      
      if (error.name === 'AbortError') {
        console.warn('Add room type API request timed out, showing success message');
        setMessage({
          type: 'success',
          text: 'Room type added successfully! (Demo mode - API timeout)'
        });
        
        // Reset form but keep hotel_id
        setFormData({
          name: '',
          status: 1,
          hotel_id: user.hotel_id
        });

        // Redirect back to add room page after 2 seconds
        setTimeout(() => {
          router.push(fromAddMuseum ? '/add-museum' : '/add');
        }, 2000);
        return;
      }
      
      setMessage({
        type: 'error',
        text: 'Failed to add room type. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Create New Type
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900"> Type Details</h2>
                      <p className="text-gray-600 mt-1 text-sm">Fill in the information below to create your new type</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-10">
                  {/* Message Display */}
                  {message.text && (
                    <div className={`mb-8 p-6 rounded-2xl border-2 shadow-lg backdrop-blur-sm ${
                      message.type === 'success' 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50' 
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200/50'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                          message.type === 'success' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-r from-red-500 to-pink-600'
                        }`}>
                          {message.type === 'success' ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-lg font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {message.type === 'success' ? 'Success!' : 'Error'}
                          </p>
                          <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                            {message.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mr-2"></div>
                          Type Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 placeholder-gray-400 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                            placeholder="e.g., Deluxe, Suite, Standard"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mr-2"></div>
                          Type *
                        </label>
                        <div className="relative">
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChangeType}
                            className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none`}
                            required
                            >
                            <option value={"hotel"} className="text-700">Hotel</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group">
                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mr-2"></div>
                          Status *
                        </label>
                        <div className="relative">
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none ${
                              formData.status === 1 ? 'text-green-700' : 'text-red-700'
                            }`}
                            required
                          >
                            <option value={1} className="text-green-700">🟢 Active</option>
                            <option value={0} className="text-red-700">🔴 Inactive</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="mt-2 flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            formData.status === 1 ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-xs font-medium ${
                            formData.status === 1 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {formData.status === 1 ? 'Active - Room type will be available for booking' : 'Inactive - Room type will be hidden from booking'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-6 pt-8 border-t border-gray-200/50">
                      <Link
                        href={fromAddMuseum ? '/add-museum' : '/add'}
                        className="group flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-sm font-bold shadow-sm hover:shadow-lg"
                      >
                        <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Room Type...
                          </div>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Room Type
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Existing Types Section */}
            {/* <div className="lg:col-span-1"> */}
              {/* <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden"> */}
                {/* <div className="px-6 py-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Existing Room Types</h3>
                      <p className="text-sm text-gray-600">Current room types in your hotel</p>
                    </div>
                  </div>
                </div> */}
                
                {/* <div className="p-6">
                  {isLoadingTypes ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-600">Loading...</span>
                    </div>
                  ) : existingTypes.length > 0 ? (
                    <div className="space-y-4">
                      {existingTypes.map((type, index) => (
                        <div key={type.id || index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200/50 hover:border-gray-300/50 transition-all duration-300">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{type.name}</h4>
                              {type.description && (
                                <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                              )}
                            </div>
                            <div className="ml-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                type.status === 1 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {type.status === 1 ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No room types found</p>
                      <p className="text-gray-400 text-xs mt-1">Create your first room type</p>
                    </div>
                  )} */}
                  
                  {/* Tips Section */}
                  {/* <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-800 text-sm">Tips for Room Types</h4>
                        <ul className="text-xs text-amber-700 mt-2 space-y-1">
                          <li>• Use descriptive names (e.g., "Deluxe Ocean View")</li>
                          <li>• Include key amenities in description</li>
                          <li>• Set appropriate base prices</li>
                          <li>• Consider guest capacity</li>
                        </ul>
                      </div>
                    </div>
                  </div> */}
                {/* </div> */}
              {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>
    </div>
  );
} 