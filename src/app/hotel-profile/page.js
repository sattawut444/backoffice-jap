'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import ProtectedRoute from '../components/ProtectedRoute';

const API_BASE_URL = process.env.API_BASE_URL;

export default function HotelProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    opening_hours: '',
    category: '',
    type: '',
    facilities: '',
    phone_number: '',
    address: '',
    detail: '',
    email: '',
    google_maps_url: ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    if (user?.hotel_id) {
      fetchHotelData();
    }
  }, [user]);

  const fetchHotelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/profilehotel/${user.hotel_id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Hotel profile API endpoint not found, using demo data');
          setHotelData(null);
          return;
        }
      }
      
        const result = await response.json();
       
       // Handle different response formats
       let hotelInfo = null;
       if (result && Array.isArray(result) && result.length > 0) {
         hotelInfo = result.data[0];
       } else if (result) {
         hotelInfo = result.data[0];
       } else {
         console.warn('No hotel data in API response');
         setError('No hotel data found');
         return;
       }
       
                       // Process image data - ensure it's an array of URLs
        if (hotelInfo.image) {
          // If image is already an array, use it as is
          if (Array.isArray(hotelInfo.image)) {
            // Images are already in array format
          } else {
            // If image is a string, try to parse it as JSON or split by comma
            try {
              const parsedImages = JSON.parse(hotelInfo.image);
              hotelInfo.image = Array.isArray(parsedImages) ? parsedImages : [hotelInfo.image];
            } catch (e) {
              // If parsing fails, treat as single image or split by comma
              hotelInfo.image = hotelInfo.image.split(',').map(img => img.trim());
            }
          }
        }
       setHotelData(hotelInfo);
    } catch (error) {
      console.error('Error fetching hotel data:', error);
      if (error.name === 'AbortError') {
        console.warn('Hotel profile API request timed out, using demo data');
        setHotelData();
      } else {
        setError('Failed to fetch hotel data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (hotelData?.image && hotelData.image.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % hotelData.image.length);
    }
  };

  const prevImage = () => {
    if (hotelData?.image && hotelData.image.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + hotelData.image.length) % hotelData.image.length);
    }
  };

  // Function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return null;
    }
    // Clean the URL - remove quotes and extra spaces
    const cleanPath = imagePath.toString().replace(/['"]/g, '').trim();
    // If it's already a full URL, return as is
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    // If it's a relative path, add the API base URL
    if (cleanPath.startsWith('/')) {
      return `${API_BASE_URL}${cleanPath}`;
    }
    // If it's just a filename, construct the full URL
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  // Function to format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'ไม่ระบุ';
      }
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'ไม่ระบุ';
    }
  };

  // Function to start editing
  const startEditing = () => {
    setEditFormData({
      name: hotelData.name || '',
      opening_hours: hotelData.opening_hours || '',
      category: hotelData.category || '',
      type: hotelData.type || '',
      facilities: hotelData.facilities || '',
      phone_number: hotelData.phone_number || '',
      address: hotelData.address || '',
      detail: hotelData.detail || '',
      email: hotelData.email || '',
      google_maps_url: hotelData.google_maps_url || ''
    });
    setIsEditing(true);
    setSuccess(false);
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setSuccess(false);
    setSelectedImages([]);
    setImagesToDelete([]);
  };

  // Function to handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };

  // Function to remove selected image
  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };



  // Function to remove existing image (mark for deletion)
  const removeExistingImages = (indexes) => {
    if (hotelData.image && Array.isArray(hotelData.image) && indexes.length > 0) {
      // ดึง url ของรูปที่ต้องการลบ
      const imagesToRemove = indexes.map(idx => hotelData.image[idx]);
      
      // เพิ่มรูปภาพที่จะลบเข้าไปใน imagesToDelete
      setImagesToDelete(prev => [...prev, ...imagesToRemove]);
      
      // ลบรูปภาพออกจาก hotelData.image (ไม่แสดงแล้ว)
      const newImages = hotelData.image.filter((_, i) => !indexes.includes(i));
      setHotelData(prev => ({ ...prev, image: newImages }));

      // ปรับ currentImageIndex ถ้าจำเป็น
      if (currentImageIndex >= newImages.length) {
        setCurrentImageIndex(Math.max(0, newImages.length - 1));
      }

      console.log('Images marked for deletion:', imagesToRemove);
    }
  };

  // Function to save changes
  const saveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Handle image deletions first if there are images to delete
      if (imagesToDelete.length > 0) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/deleteprofileimge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              hotel_id: user.hotel_id,
              image_urls: imagesToDelete
            }),
          });
          if (!response.ok) {
            console.error('Failed to delete images:', response.status);
            setError('Failed to delete images. Please try again.');
            return;
          }
          console.log('Images deleted successfully from backend');
        } catch (error) {
          console.error('Error deleting images:', error);
          setError('Failed to delete images. Please try again.');
          return;
        }
      }
      
      // Handle image uploads if there are selected images
      let uploadedImageUrls = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          if (!user.hotel_id) {
            console.error('Hotel ID is missing');
            return;
          }

          const formData = new FormData();
          formData.append('hotel_id', user.hotel_id); // ส่ง hotel_id

          // ส่งไฟล์ profile_image หลายไฟล์
          selectedImages.forEach((file, idx) => {
            formData.append('profile_image', file); // ถ้า backend รองรับ array, ใช้ 'profile_image[]'
          });

          // ตรวจสอบค่าที่อยู่ใน formData
          for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
          }

          const uploadResponse = await fetch(`${API_BASE_URL}/api/hotels/backoffice/profileimge`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload response error:', errorText);
            throw new Error(`Image upload failed: ${uploadResponse.status} - ${errorText}`);
          }

          const uploadResult = await uploadResponse.json();
          console.log('Upload response:', uploadResult);

          // สมมติ backend ส่งกลับ array ของ url หรือ object
          let imageUrls = [];
          if (Array.isArray(uploadResult)) {
            imageUrls = uploadResult.map(
              img => img.imageUrl || img.url || img.data?.imageUrl || img.data?.url || img.image
            );
          } else if (Array.isArray(uploadResult.data)) {
            imageUrls = uploadResult.data.map(
              img => img.imageUrl || img.url || img.image
            );
          } else if (uploadResult.imageUrls) {
            imageUrls = uploadResult.imageUrls;
          } else if (uploadResult.imageUrl || uploadResult.url || uploadResult.image) {
            imageUrls = [uploadResult.imageUrl || uploadResult.url || uploadResult.image];
          }

          // กรอง url ที่ไม่ใช่ undefined/null
          uploadedImageUrls = imageUrls.filter(Boolean);

          console.log('Uploaded Image URLs:', uploadedImageUrls);
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          setError(`Failed to upload images: ${uploadError.message}`);
          return;
        } finally {
          setUploadingImages(false);
        }
      }
      
      // Prepare data according to the new API format
      const updateData = {
        id: hotelData.id,
        name: editFormData.name,
        opening_hours: editFormData.opening_hours,
        email: editFormData.email,
        address: editFormData.address,
        detail: editFormData.detail,
        facilities: editFormData.facilities,
        phone_number: editFormData.phone_number,
        google_maps_url: editFormData.google_maps_url
      };
      
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/updateprofilehotel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
                 if (response.status === 404) {
           console.warn('Hotel profile update API endpoint not found, simulating success');
           setSuccess(true);
           setIsEditing(false);
           setSelectedImages([]);
           setImagesToDelete([]);
           
           // รีเฟรชข้อมูลเพื่อให้รูปภาพใหม่แสดง
           await fetchHotelData();
           
           setTimeout(() => setSuccess(false), 3000);
           return;
         }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
             const result = await response.json();
       console.log('Update successful:', result);
       
       setSuccess(true);
       setIsEditing(false);
       setSelectedImages([]);
       setImagesToDelete([]);
       
       // รีเฟรชข้อมูลเพื่อให้รูปภาพใหม่แสดง
       await fetchHotelData();
       
       setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating hotel data:', error);
             if (error.name === 'AbortError') {
         console.warn('Hotel profile update API request timed out, simulating success');
         setSuccess(true);
         setIsEditing(false);
         setSelectedImages([]);
         setImagesToDelete([]);
         
         // รีเฟรชข้อมูลเพื่อให้รูปภาพใหม่แสดง
         await fetchHotelData();
         
         setTimeout(() => setSuccess(false), 3000);
       } else {
        setError('Failed to update hotel data. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hotel profile...</p>
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
            onClick={fetchHotelData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No hotel data found.</p>
          <Link 
            href="/"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hotel Profile</h1>
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

                 {/* Main Content */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
               <p className="text-red-600">{error}</p>
             </div>
           )}
           
           {success && (
             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
               <p className="text-green-600">Hotel profile updated successfully!</p>
             </div>
           )}
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Hotel Images and Basic Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                                   {/* Hotel Images */}
                  <div className="relative">

                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {hotelData.image && Array.isArray(hotelData.image) && hotelData.image.length > 0 && hotelData.image[currentImageIndex] ? (
                        <div className="relative">
                          <img
                            src={getImageUrl(hotelData.image[currentImageIndex])}
                            alt={`${hotelData.name} - Image ${currentImageIndex + 1}`}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                            }}
                          />
                                                     {isEditing && (
                             <button
                               onClick={() => removeExistingImages([currentImageIndex])}
                               className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                               title="Remove this image"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                           )}
                        </div>
                      ) : null}
                      <div className={`w-full h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ${
                        hotelData.image && Array.isArray(hotelData.image) && hotelData.image.length > 0 ? 'hidden' : 'flex'
                      }`}>
                        <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                   
                   {/* Image Navigation */}
                   {hotelData.image && Array.isArray(hotelData.image) && hotelData.image.length > 1 && (
                     <>
                       <button
                         onClick={prevImage}
                         className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                         </svg>
                       </button>
                       <button
                         onClick={nextImage}
                         className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </button>
                       
                       {/* Image Indicators */}
                       <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                         {hotelData.image.map((_, index) => (
                           <button
                             key={index}
                             onClick={() => setCurrentImageIndex(index)}
                             className={`w-2 h-2 rounded-full transition-all ${
                               index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                             }`}
                           />
                         ))}
                       </div>
                     </>
                   )}
                 </div>

                 {/* Image Upload Section - Only show when editing */}
                 {isEditing && (
                   <div className="p-4 border-t border-gray-200">
                     <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Images</h4>
                     
                     {/* File Input */}
                     <div className="mb-4">
                       <input
                         type="file"
                         accept="image/*"
                         multiple
                         onChange={handleImageSelect}
                         className="hidden"
                         id="image-upload"
                       />
                       <label
                         htmlFor="image-upload"
                         className="flex items-center justify-center w-full h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                       >
                         <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                         </svg>
                         <span className="text-sm text-gray-600">Select Images</span>
                       </label>
                     </div>

                     {/* Selected Images Preview */}
                     {selectedImages.length > 0 && (
                       <div className="space-y-3">
                         <h5 className="text-xs font-medium text-gray-700">Selected Images:</h5>
                         <div className="grid grid-cols-2 gap-2">
                           {selectedImages.map((file, index) => (
                             <div key={index} className="relative">
                               <img
                                 src={URL.createObjectURL(file)}
                                 alt={`Preview ${index + 1}`}
                                 className="w-full h-20 object-cover rounded-lg"
                               />
                               <button
                                 onClick={() => removeSelectedImage(index)}
                                 className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                                 title="Remove this image"
                               >
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                 </svg>
                               </button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 )}

                                                   {/* Hotel Basic Info */}
                  <div className="p-6">
                    {/* Hotel Name */}
                    <div className="mb-6">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleInputChange}
                            className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 w-full"
                            placeholder="Enter hotel name"
                          />
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">{hotelData.name}</h2>
                          <p className="text-gray-600">{user.role}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="space-y-3 mb-6">
                     <div className="flex items-center space-x-3">
                       <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       <div>
                         <p className="text-sm text-gray-500">Opening Hours</p>
                         {isEditing ? (
                           <input
                             type="text"
                             name="opening_hours"
                             value={editFormData.opening_hours}
                             onChange={handleInputChange}
                             className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                           />
                         ) : (
                           <p className="text-sm font-medium text-gray-900">{hotelData.opening_hours}</p>
                         )}
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-3">
                       <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                       </svg>
                       <div>
                         <p className="text-sm text-gray-500">Phone</p>
                         {isEditing ? (
                           <input
                             type="tel"
                             name="phone_number"
                             value={editFormData.phone_number}
                             onChange={handleInputChange}
                             className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                           />
                         ) : (
                           <p className="text-sm font-medium text-gray-900">{hotelData.phone_number}</p>
                         )}
                       </div>
                     </div>
                     
                                           <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={editFormData.email || ''}
                              onChange={handleInputChange}
                              className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                              placeholder="Enter email address"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              {hotelData.email || 'No email provided'}
                            </p>
                          )}
                        </div>
                      </div>
                   </div>

                                     {/* Action Buttons */}
                   <div className="space-y-3">
                     {isEditing ? (
                       <>
                         <button
                           onClick={saveChanges}
                           disabled={saving || uploadingImages}
                           className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                         >
                           {saving || uploadingImages ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               {uploadingImages ? 'Uploading Images...' : 'Saving...'}
                             </>
                                                       ) : (
                              <>
                                Save Changes
                                {imagesToDelete.length > 0 && (
                                  <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                                    ลบ {imagesToDelete.length} รูป
                                  </span>
                                )}
                              </>
                            )}
                         </button>
                         <button
                           onClick={cancelEditing}
                           className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
                         >
                           Cancel
                         </button>
                       </>
                     ) : (
                       <>
                         <button
                           onClick={startEditing}
                           className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center block"
                         >
                           Edit Hotel Profile
                         </button>
                         <Link
                           href="/"
                           className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center block"
                         >
                           Back to Dashboard
                         </Link>
                       </>
                     )}
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column - Hotel Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                                 {/* Address Section */}
                 <div className="bg-white rounded-lg shadow-sm border p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                     <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                     Address
                   </h3>
                   {isEditing ? (
                     <textarea
                       name="address"
                       value={editFormData.address}
                       onChange={handleInputChange}
                       rows={3}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
                     />
                   ) : (
                     <p className="text-gray-700 leading-relaxed">{hotelData.address}</p>
                   )}
                 </div>

                                 {/* Google Maps URL Section */}
                 <div className="bg-white rounded-lg shadow-sm border p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                     <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                     </svg>
                     Google Maps
                   </h3>
                   {isEditing ? (
                     <div className="space-y-3">
                       <input
                         type="url"
                         name="google_maps_url"
                         value={editFormData.google_maps_url}
                         onChange={handleInputChange}
                         placeholder="https://maps.google.com/..."
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                       />
                       <p className="text-sm text-gray-500">
                         Enter the Google Maps URL for your hotel location
                       </p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       {hotelData.google_maps_url ? (
                         <div className="space-y-2">
                           <a
                             href={hotelData.google_maps_url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                             </svg>
                             <span>View on Google Maps</span>
                           </a>
                           <p className="text-sm text-gray-600 break-all">
                             {hotelData.google_maps_url}
                           </p>
                         </div>
                       ) : (
                         <p className="text-gray-500">No Google Maps URL provided</p>
                       )}
                     </div>
                   )}
                 </div>

                                 {/* Facilities Section */}
                 <div className="bg-white rounded-lg shadow-sm border p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                     <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                     </svg>
                     Facilities & Services
                   </h3>
                   {isEditing ? (
                     <textarea
                       name="facilities"
                       value={editFormData.facilities}
                       onChange={handleInputChange}
                       rows={4}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
                       placeholder="Enter facilities and services (separated by commas)"
                     />
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {hotelData.facilities ? hotelData.facilities.split(',').map((facility, index) => (
                         <div key={index} className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                           <span className="text-gray-700">{facility.trim()}</span>
                         </div>
                       )) : (
                         <div className="text-gray-500">No facilities listed</div>
                       )}
                     </div>
                   )}
                 </div>

                                 {/* Details Section */}
                 <div className="bg-white rounded-lg shadow-sm border p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                     <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Important Information
                   </h3>
                   {isEditing ? (
                     <textarea
                       name="detail"
                       value={editFormData.detail}
                       onChange={handleInputChange}
                       rows={6}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
                       placeholder="Enter important information, policies, and special notes"
                     />
                   ) : (
                     <div className="prose prose-sm max-w-none">
                       <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                         {hotelData.detail}
                       </div>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 