'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
const API_BASE_URL = process.env.API_BASE_URL;
// Helper function to ensure scalar values
const ensureScalarValue = (value, defaultValue = '') => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return String(value);
};

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  
  const [formData, setFormData] = useState({
    id: '',
    room_code: '',
    room_type: '',
    detail: '',
    number_beds: '',
    number_guests: '',
    all_room: 0,
    price: '',
    status: 1
  });

  // Fetch room data on component mount
  useEffect(() => {
    if (params.id && user) {
      fetchRoomData();
      fetchRoomTypes(); // Fetch room types immediately
    }
  }, [params.id, user]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      
      // Fetch room data using hotel_id and room id
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/room/${user.hotel_id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.ok}`);
      }
      
      const result = await response.json();
      const rooms = Array.isArray(result.data) ? result.data : [];
      
      // Find the specific room by ID
      const room = rooms.find(r => r.id == params.id || r.hotels_plans_id == params.id);
      
      if (!room) {
        showErrorAlert('Room not found');
        router.push('/');
        return;
      }
      // Populate form data with proper fallbacks
      const formDataToSet = {
        id: ensureScalarValue(room.id || room.hotels_plans_id),
        room_code: ensureScalarValue(room.room_code),
        room_type: ensureScalarValue(room.room_type || room.type),
        detail: ensureScalarValue(room.detail),
        number_beds: ensureScalarValue(room.number_beds),
        number_guests: ensureScalarValue(room.number_guests),
        all_room: ensureScalarValue(room.all_room),
        price: ensureScalarValue(room.price),
        image: room.image || [],
        status: room.status !== undefined && room.status !== null ? Number(room.status) : 1
      };
      setFormData(formDataToSet);

      // Set existing images if available
      if (room.image) {
        const images = Array.isArray(room.image) ? room.image : [room.image];
        // Filter out empty/null/undefined values
        const validImages = images.filter(img => img && img.trim() !== '');
        console.log('Valid images found:', validImages);
        setExistingImages(validImages);
      } else {
        console.log('No images found in room data');
        setExistingImages([]);
      }
      
    } catch (error) {
      console.error('Error fetching room data:', error);
      showErrorAlert('Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      setIsLoadingTypes(true);
      
      // เพิ่ม timeout สำหรับ API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      // console.log('user.hotel_id: ', user);
      const url = `${API_BASE_URL}/api/hotels/backoffice/type?hotel_id=${user.hotel_id}`;
      const response = await fetch(`${url}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Room types API endpoint not found, using default types');
          // ใช้ default types แทน
          setRoomTypes();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setRoomTypes(result.data);
      } else {
        console.warn('No room types data in API response, using default types');
        setRoomTypes([]);
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
      
      // จัดการ timeout error
      if (error.name === 'AbortError') {
        console.warn('Room types API request timed out, using default types');
      }
      
      // Set default types on error
      setRoomTypes([]);
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // เพิ่มรูปภาพใหม่ต่อจากรูปภาพเดิม
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs สำหรับรูปภาพใหม่
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  const removeExistingImage = (index) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExistingImages);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...previews]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add new images
      selectedImages.forEach((image, index) => {
        formDataToSend.append(`profile_image`, image);
      });

      // Add existing images that weren't removed
      existingImages.forEach((image, index) => {
        formDataToSend.append(`existing_images[${index}]`, image);
      });

      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/updateroom`, {
        method: 'PUT',
        body: formDataToSend,
      });
console.log('response: ',response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showSuccessAlert('Room updated successfully!');
      
      // Redirect back to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating room:', error);
      showErrorAlert('Failed to update room. Please try again.');
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
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };
  // console.log('formData: ',formData);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Component */}
      {alert.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          alert.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            {alert.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {alert.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Edit Room</h1>
            <Link 
              href="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span>Hotel Regina Kawaguchiko</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900">Room Information</h2>
              <p className="text-sm text-gray-600 mt-1">Update room details below</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Room Code *</label>
                    <input
                      type="text"
                      name="room_code"
                      value={ensureScalarValue(formData.room_code)}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Enter room code"
                      required
                    />
                  </div>
                </div>

                {/* Room Type and Facilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Room Type *</label>
                    <select
                      name="room_type"
                      value={ensureScalarValue(formData.room_type)}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-colors"
                      // required
                      disabled={isLoadingTypes}
                    >
                      <option value="">{formData.room_type}</option>
                      {Array.isArray(roomTypes) && roomTypes.length > 0 && roomTypes.map((type, index) => (
                        <option key={`${type.id}-${index}`} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {isLoadingTypes && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        Loading room types...
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">Need a new room type?</p>
                        <Link
                          href="/add-type"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Create New Type
                        </Link>
                      </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      Total Rooms *
                    </label>
                    <input
                      type="number"
                      name="all_room"
                      value={formData.all_room}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter number of beds"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Capacity Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Number of Beds *</label>
                    <input
                      type="number"
                      name="number_beds"
                      value={ensureScalarValue(formData.number_beds)}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Number of beds"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Maximum Guests *</label>
                    <input
                      type="number"
                      name="number_guests"
                      value={ensureScalarValue(formData.number_guests)}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Maximum guests"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Price per Night (JPY) *</label>
                    <input
                      type="number"
                      name="price"
                      value={ensureScalarValue(formData.price)}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="Price per night"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Status *</label>
                  <select
                    name="status"
                    value={formData.status !== undefined && formData.status !== null ? String(formData.status) : '1'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-colors"
                    required
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                {/* Existing Images */}
                
                {existingImages.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      รูปภาพปัจจุบัน
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {existingImages.map((image, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={`${API_BASE_URL}${image}`} 
                              alt={`Existing ${index + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                              onError={(e) => {
                                console.error(`Failed to load image: ${API_BASE_URL}${image}`);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                            title="ลบรูปภาพ"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            รูปภาพ {index + 1}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Images
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      name="images"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold text-blue-600 hover:text-blue-500">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวางที่นี่
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG ขนาดไม่เกิน 10MB</p>
                      </div>
                    </label>
                  </div>
                  
                  {/* New Image Preview */}
                  {imagePreview.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">รูปภาพใหม่ที่เลือก:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imagePreview.map((preview, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                              title="ลบรูปภาพ"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {selectedImages[index]?.name || `รูปภาพใหม่ ${index + 1}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Additional Details</label>
                  <textarea
                    name="detail"
                    value={ensureScalarValue(formData.detail)}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-colors resize-none"
                    placeholder="Additional room details such as view, room size, special amenities..."
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </div>
                    ) : (
                      'Update Room'
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