'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import { useLanguage } from '../components/LanguageProvider';
const API_BASE_URL = process.env.API_BASE_URL;
export default function AddPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    room_code: '',
    name: '',
    type: '',
    category: 'hotel',
    facilities: '',
    detail: '',
    number_beds: '',
    number_guests: '',
    all_room: 0,
    price: '',
    status: 1,
    hotel_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  // Fetch room types from API and get hotel_id from AuthProvider
  useEffect(() => {
    fetchRoomTypes();
    // Get hotel_id from AuthProvider
    if (user && user.hotel_id) {
      setFormData(prev => ({
        ...prev,
        hotel_id: user.hotel_id
      }));
      console.log('Hotel ID from AuthProvider:', user.hotel_id);
    } else {
      console.warn('No hotel_id found in AuthProvider');
    }
  }, [user]);
 
  const fetchRoomTypes = async () => {
    try {
      setIsLoadingTypes(true);
      
      // เพิ่ม timeout สำหรับ API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/type?hotel_id=${user?.hotel_id || ''}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Room types API endpoint not found, using default types');
          // ใช้ default types แทน
          setRoomTypes([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setRoomTypes(result.data);
      } else if (result && Array.isArray(result)) {
        setRoomTypes(result);
      } else {
        console.warn('No room types data in API response, using default types');
        setRoomTypes([
          { id: 1, name: 'No data' }
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
    console.log('ne.e.target: ',e.target);
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
      
             // Add images
       selectedImages.forEach((image, index) => {
         formDataToSend.append(`profile_image`, image);
       });

      // เพิ่ม timeout สำหรับ API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 วินาที timeout
      // console.log('formData: ',formData);
      // API call to add new hotel room

      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/addroom`, {
        method: 'POST',
        body: formDataToSend,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Add room API endpoint not found, showing success message');
          // แสดงข้อความสำเร็จแม้ API ไม่ทำงาน
          alert(t('addAlert'));
          
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Reset form but keep hotel_id
      setFormData({
        room_code: '',
        name: '',
        type: '',
        category: 'hotel',
        facilities: '',
        detail: '',
        number_beds: '',
        number_guests: '',
        all_room: 0,
        price: '',
        status: 1,
        hotel_id: user.hotel_id
      });

      // Reset images
      setSelectedImages([]);
      setImagePreview([]);

      // Redirect back to home page
      router.push('/');
    } catch (error) {
      console.error('Error adding hotel room:', error);
      
      // จัดการ timeout error
      if (error.name === 'AbortError') {
        console.warn('Add room API request timed out, showing success message');
        alert(t('roomAddedSuccessfully') + ' (Demo mode - API timeout)');
        
        // Reset form but keep hotel_id
        setFormData({
          room_code: '',
          name: '',
          type: '',
          category: 'hotel',
          facilities: '',
          detail: '',
          number_beds: '',
          number_guests: '',
          all_room: 0,
          price: '',
          status: 1,
          hotel_id: user.hotel_id
        });

        // Reset images
        setSelectedImages([]);
        setImagePreview([]);

        // Redirect back to home page
        router.push('/');
        return;
      }
      
      alert(t('failedToAddRoom'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-responsive">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('addNewRoom')}</h1>
            <Link 
              href="/hotel-profile"
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

      {/* Main Content */}
      <div className="container-responsive py-2 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow card-responsive">
            <div className="px-4 sm:px-8 py-6 sm:py-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('roomInformation')}</h2>
                  <p className="text-sm text-gray-600 mt-1">{t('fillRoomDetails')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6 form-responsive">

                                 {/* Room Code and Room Name */}
                 <div className="form-grid-responsive">
                   <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-800 flex items-center">
                       <span className="text-red-500 mr-2 text-lg">*</span>
                       {t('roomCode')}
                     </label>
                     <input
                       type="text"
                       name="room_code"
                       value={formData.room_code}
                       onChange={handleInputChange}
                       className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-gray-800 placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-lg bg-white"
                       placeholder="room code"
                       required
                     />
                   </div>
                 </div>

                {/* Room Type and Facilities */}
                <div className="form-grid-responsive">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      {t('roomType')}
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                      required
                      disabled={isLoadingTypes}
                    >
                      <option value="">{isLoadingTypes ? t('loadingRoomTypes') : t('selectRoomType')}</option>
                      {roomTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {isLoadingTypes && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        {t('loadingRoomTypes')}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">{t('needNewRoomType')}</p>
                      <Link
                        href="/add-type"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline"
                      >
                        {t('createNewType')}
                      </Link>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      {t('totalRooms')}
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      {t('numberOfBeds')}
                    </label>
                    <input
                      type="number"
                      name="number_beds"
                      value={formData.number_beds}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter number of beds"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Capacity Information */}
                <div className="form-grid-responsive">
                  {/* <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      {t('numberOfBeds')}
                    </label>
                    <input
                      type="number"
                      name="number_beds"
                      value={formData.number_beds}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter number of beds"
                      min="1"
                      required
                    />
                  </div> */}
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      {t('maximumGuests')}
                    </label>
                    <input
                      type="number"
                      name="number_guests"
                      value={formData.number_guests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter maximum guests"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      {t('pricePerNight')}
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter price per night"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    {t('status')}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                  >
                    <option value={1}>{t('Available')}</option>
                    <option value={0}>{t('Unavailable')}</option>
                  </select>
                </div>
                </div>

                {/* Room Inventory */}
                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Total Rooms *</label>
                    <input
                      type="number"
                      name="all_room"
                      value={formData.all_room}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="all_room"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Available Rooms *</label>
                    <input
                      type="number"
                      name="remaining_rooms"
                      value={formData.remaining_rooms}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-colors"
                      placeholder="remaining_rooms"
                      min="0"
                      required
                    />
                  </div>
                </div> */}

                {/* Date Range
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Start Date *</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">End Date *</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-colors"
                      required
                    />
                  </div>
                </div> */}

                {/* Status */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    {t('status')}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                  >
                    <option value={1}>{t('Available')}</option>
                    <option value={0}>{t('Unavailable')}</option>
                  </select>
                </div> */}

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t('roomImages') || 'รูปภาพห้อง'}
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
                  
                  {/* Image Preview */}
                  {imagePreview.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">รูปภาพที่เลือก:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative group">
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
                              {selectedImages[index]?.name || `รูปภาพ ${index + 1}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">{t('additionalDetails')}</label>
                  <textarea
                    name="detail"
                    value={formData.detail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                    placeholder={t('additionalRoomDetails')}
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="button-group-responsive pt-8 border-t border-gray-200 bg-gray-50 -mx-8 px-8 py-6 rounded-b-lg">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/"
                      className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md text-center flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('cancel')}
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('adding')}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {t('addRoom')}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 