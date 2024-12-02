import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GalleryWithSearch = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessMessageVisible, setIsSuccessMessageVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch gallery images from DB
  const fetchGalleryImages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/gallery');
      setGalleryImages(response.data.galleryImages);
    } catch (error) {
      setErrorMessage('Failed to load gallery images. Please try again.');
    }
  };

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  // Fetch available images to display in modal
  const fetchAvailableImages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }

      const response = await axios.get('http://localhost:5000/photos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAvailableImages(response.data);
    } catch (error) {
      setErrorMessage('Failed to load available images. Please try again.');
    }
  };

  // Toggle image selection in the modal
  const toggleImageSelection = (imageId) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(imageId)
        ? prevSelected.filter((id) => id !== imageId)
        : [...prevSelected, imageId]
    );
  };

  // Add selected images to gallery
  const handleAddImagesToGallery = async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to add to the gallery.');
      return;
    }

    try {
      for (const imageId of selectedImages) {
        const image = availableImages.find((img) => img._id === imageId);
        await axios.post('http://localhost:5000/addgallery', {
          title: `Image ${imageId}`, // Provide a dynamic title
          description: `Description for image ${imageId}`, // Provide a dynamic description
          imageUrl: image.url,
        });
      }

      setIsSuccessMessageVisible(true);
      setTimeout(() => setIsSuccessMessageVisible(false), 3000);
      setIsModalOpen(false);
      setSelectedImages([]);
      fetchGalleryImages();
    } catch (error) {
      setErrorMessage('Failed to add images to gallery. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Gallery</h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            fetchAvailableImages();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Add Images
        </button>
      </div>

      {/* Display Gallery Images */}
      <div className="grid grid-cols-3 gap-6">
        {galleryImages.map((image) => (
          <div key={image._id} className="gallery-item">
            <img src={image.imageUrl} alt={image.title} className="w-full h-64 object-cover rounded-lg" />
            <div className="mt-2">
              <h3 className="font-semibold">{image.title}</h3>
              <p className="text-sm text-gray-600">{image.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Images Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-4xl w-full relative">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none text-2xl"
            >
              &times;
            </button>

            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Add Images to Gallery</h2>

            {/* Available Images Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-64 overflow-y-auto">
              {availableImages.map((image) => (
                <div
                  key={image._id}
                  className={`border rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 transform hover:scale-105 ${
                    selectedImages.includes(image._id) ? 'border-blue-500 border-4' : ''
                  }`}
                  onClick={() => toggleImageSelection(image._id)}
                >
                  <img src={image.url} alt={image.title} className="w-full h-40 object-cover" />
                </div>
              ))}
            </div>

            {/* Add Button */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleAddImagesToGallery}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              >
                Add to Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isSuccessMessageVisible && (
        <div className="mt-4 text-green-500 text-center">
          Images added to gallery successfully!
        </div>
      )}

      {/* Error Message */}
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
    </div>
  );
};

export default GalleryWithSearch;
