'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import ProtectedRoute from '../components/ProtectedRoute';

const API_BASE_URL = process.env.API_BASE_URL;
export default function ProfilePage() {
  const { logout, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    firstname: '',
    lastname: '',
    email: '',
    category: '',
    address: '',
    detail: '',
    type: '',
    facilities: '',
    phone_number: '',
    image: '',
    created_at: ''
  });

  const [editData, setEditData] = useState({ ...profileData });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    if (!user || !user.hotel_id) {
      console.log('No user or user.hotel_id found:', user);
      setIsFetching(false);
      return;
    }

    try {
      setIsFetching(true);
      setError(null);
      
      console.log('Fetching profile for hotel_id:', user.hotel_id);
      
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/profile/${user.hotel_id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Profile API Response:', result);
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const apiProfile = result.data[0];
        console.log('API Profile Data:', apiProfile);
        
        setProfileData(apiProfile);
        setEditData(apiProfile);
      } else {
        console.log('No data in API response');
        setError('No profile data found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(`Failed to load profile data: ${error.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch profile data when user changes
  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('hotel_id', user.hotel_id);

      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update the image URL in editData
      setEditData(prev => ({
        ...prev,
        image: result.imageUrl || result.url || result.data?.imageUrl || result.data?.url
      }));
      
      // Update profileData to show the new image immediately
      setProfileData(prev => ({
        ...prev,
        image: result.imageUrl || result.url || result.data?.imageUrl || result.data?.url
      }));
      
      setSelectedImage(null);
      setImagePreview(null);
      
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
console.log("editData",editData);
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const apiData = {
        id: editData.id,
        name: editData.name,
        category: editData.category,
        address: editData.address,
        detail: editData.detail || '',
        type: editData.type || '',
        facilities: editData.facilities || '',
        phone_number: editData.phone_number,
        image: editData.image || '',
        firstname: editData.firstname,
        lastname: editData.lastname
      };

      console.log('Sending data to API:', apiData);
      
      // Update profile via API
      const response = await fetch(`${API_BASE_URL}/api/hotels/backoffice/updateprofile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Update Profile Response:', result);
      
      setProfileData(editData);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-white">Loading profile...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (isFetching) {
    return (
      <ProtectedRoute>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-white">Loading profile data...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-white">Manage personal information and user account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4">
                  {profileData.image ? (
                    <img
                      src={profileData.image}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                      profileData.image ? 'hidden' : 'flex'
                    }`}
                  >
                    <span className="text-white text-2xl font-bold">
                      {profileData.firstname ? profileData.firstname.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profileData.firstname} {profileData.lastname}</h2>
                <p className="text-sm text-gray-500">{profileData.name}</p>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">Join Date</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm text-gray-600">Hotel ID</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{profileData.id || 'N/A'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Hotel Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstname"
                        value={editData.firstname}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastname"
                        value={editData.lastname}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={editData.phone_number}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={editData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Type
                      </label>
                      <input
                        type="text"
                        name="type"
                        value={editData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Facilities
                      </label>
                      <input
                        type="text"
                        name="facilities"
                        value={editData.facilities}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Profile Image
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => document.getElementById('image-upload').click()}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Choose Image</span>
                        </button>
                        {profileData.image && (
                          <span className="text-sm text-gray-600">
                            Current: {profileData.image.split('/').pop()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={editData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Detail
                    </label>
                    <textarea
                      name="detail"
                      value={editData.detail}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-gray-900"
                    />
                  </div>

                  {/* Image Upload Section */}
                  {selectedImage && (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-800 mb-3">
                        Profile Image Preview
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={handleImageUpload}
                              disabled={isUploading}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isUploading ? 'Uploading...' : 'Upload Image'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview(null);
                              }}
                              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Hotel Name</label>
                      <p className="text-gray-900 font-medium">{profileData.name || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                      <p className="text-gray-900 font-medium">{profileData.firstname || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                      <p className="text-gray-900 font-medium">{profileData.lastname || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900 font-medium">{profileData.email || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                      <p className="text-gray-900 font-medium">{profileData.phone_number || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                      <p className="text-gray-900 font-medium">{profileData.category || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                      <p className="text-gray-900 font-medium">{profileData.type || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Facilities</label>
                      <p className="text-gray-900 font-medium">{profileData.facilities || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                    <p className="text-gray-900">{profileData.address || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Detail</label>
                    <p className="text-gray-900">{profileData.detail || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 