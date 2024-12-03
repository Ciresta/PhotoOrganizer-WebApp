import React, { useState, useEffect } from 'react';
import axios from 'axios';
import searchIcon from '../assets/images/search.svg';

const CreateGallery = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  // Fetch gallery images on component mount
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMessage('No authentication token found. Please log in.');
          return;
        }

        const response = await axios.get('http://localhost:5000/gallery', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setGalleryImages(response.data.galleryImages || []);
      } catch (error) {
        console.error('Error fetching gallery images:', error.response?.data || error.message);
        setErrorMessage('Failed to load gallery images. Please try again.');
      }
    };

    fetchGalleryImages();
  }, []);

  // Fetch photos for modal when it's opened
  useEffect(() => {
    const fetchPhotos = async () => {
      if (isModalOpen) {
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

          // Exclude photos already in the gallery
          const galleryImageUrls = galleryImages.map((img) => img.imageUrl);
          const filteredPhotos = response.data.filter(
            (photo) => !galleryImageUrls.includes(photo.url)
          );

          setPhotos(filteredPhotos);
        } catch (error) {
          console.error('Error fetching photos:', error.response || error);
          setErrorMessage('Failed to load photos. Please try again.');
        }
      }
    };

    fetchPhotos();
  }, [isModalOpen, galleryImages]);

  // Search functionality for photos
  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      setIsLoading(true);
      setSearchResults([]);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMessage('No authentication token found. Please log in.');
          return;
        }

        const response = await axios.post(
          'http://localhost:5000/searchPhotos',
          { searchTerm },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const galleryImageUrls = galleryImages.map((img) => img.imageUrl);
        const resultsWithCorrectUrls = response.data
          .map((photo) => ({
            ...photo,
            url: photo.url.includes('http') ? photo.url : `http://localhost:5000/${photo.url}`,
          }))
          .filter((photo) => !galleryImageUrls.includes(photo.url));

        setSearchResults(resultsWithCorrectUrls);
      } catch (error) {
        console.error('Error searching photos:', error.response?.data || error.message);
        setErrorMessage('Failed to search photos. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle photo selection
  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  // Add selected photos to gallery
  const addPhotosToGallery = async () => {
    const photosToSave = photos
      .filter((photo) => selectedPhotos.includes(photo.id))
      .map(({ id, title, description, url }) => ({
        title,
        description,
        imageUrl: url,
      }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }

      await axios.post(
        'http://localhost:5000/addgallery',
        { photos: photosToSave },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Photos added to gallery successfully!');
      setIsModalOpen(false);
      setSelectedPhotos([]);
    } catch (error) {
      console.error('Error adding photos to gallery:', error.response?.data || error.message);
      setErrorMessage('Failed to add photos. Please try again.');
    }
  };

  // Delete photo from gallery
  const deletePhotoFromGallery = async (imageUrl) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }

      await axios.post(
        'http://localhost:5000/deletegallery',
        { imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGalleryImages(galleryImages.filter((image) => image.imageUrl !== imageUrl));
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo from gallery:', error.response?.data || error.message);
      setErrorMessage('Failed to delete photo. Please try again.');
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-green-500 text-white rounded-lg"
      >
        Add Photos
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-4xl w-full relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none text-2xl"
            >
              &times;
            </button>

            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Add Photos to Common Gallery</h2>

            <div className="relative mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search photos..."
                className="w-full bg-[#f8f9fa] text-gray-700 pl-12 pr-4 py-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <img src={searchIcon} alt="Search" className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-64 overflow-y-auto">
              {(searchResults.length > 0 ? searchResults : photos).map((photo) => (
                <div
                  key={photo.id}
                  className={`border rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 transform hover:scale-105 ${selectedPhotos.includes(photo.id) ? 'border-blue-500 border-4' : ''
                    }`}
                  onClick={() => togglePhotoSelection(photo.id)}
                >
                  <img src={photo.url} alt={photo.filename} className="w-full h-40 object-cover" />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={addPhotosToGallery}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              >
                Add Photos
              </button>
            </div>

            {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
          </div>
        </div>
      )}

      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gallery</h1>

        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {galleryImages.length > 0 ? (
            galleryImages.map((image) => (
              <div
                key={image.imageUrl}
                className="relative border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <button
                  onClick={() => deletePhotoFromGallery(image.imageUrl)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none"
                >
                  &times;
                </button>
                <img
                  src={image.imageUrl}
                  alt={image.title || 'Gallery Image'}
                  className="w-full h-40 object-cover"
                />
                <div className="p-2">
                  <h2 className="text-sm font-semibold text-gray-700 truncate">{image.title}</h2>
                  <p className="text-xs text-gray-500 truncate">{image.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 col-span-full text-center">
              No images available in the gallery.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGallery;
