import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterModal from './DateFilter';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const Dashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch photos from the backend
  const fetchPhotos = async (fromDate, toDate, location) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }
  
      const response = await axios.get(`http://localhost:5000/photos`, {
        params: {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          location: location || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error.response || error);
      setErrorMessage(error.response?.data?.error || 'Failed to load photos. Please try again.');
    }
  };
  
  useEffect(() => {
    fetchPhotos();
  }, []);

  // Handle filter application
  const handleFilterApply = (fromDate, toDate, location) => {
    fetchPhotos(fromDate, toDate, location);
  };

  // Group photos by date
  const groupPhotosByDate = (photos) => {
    const grouped = {};
    photos.forEach(photo => {
      if (!photo.creationTime) {
        console.error('Missing creationTime for photo:', photo);
        return;
      }

      const photoDate = parseISO(photo.creationTime);
      if (isNaN(photoDate)) return;

      const dateKey = format(photoDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(photo);
    });

    return grouped;
  };

  // Format date header
  const formatDateHeader = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, MMM d');
  };

  // Handle search functionality
  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      setIsLoading(true);
      setSearchResults([]); // Clear previous results

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMessage('No authentication token found. Please log in.');
          return;
        }

        // Call the backend searchPhotos endpoint
        const response = await axios.post('http://localhost:5000/searchPhotos', {
          searchTerm,
          photos, // Pass the cached photos for analysis
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSearchResults(response.data); // Update search results
      } catch (error) {
        console.error('Error searching photos:', error.response.data || error.message);
        setErrorMessage(error.response?.data?.error || 'Failed to search photos. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const groupedPhotos = groupPhotosByDate(photos);

  return (
    <div className="p-8">
      <h1 className="text-5xl font-bold mb-4">
        <span style={{ color: '#4285F4' }}>G</span>
        <span style={{ color: '#EA4335' }}>o</span>
        <span style={{ color: '#FBBC05' }}>o</span>
        <span style={{ color: '#4285F4' }}>g</span>
        <span style={{ color: '#34A853' }}>l</span>
        <span style={{ color: '#EA4335' }}>e</span>&nbsp;
        <span style={{ background: 'linear-gradient(270deg, #4285F4, #EA4335, #FBBC05, #34A853)', backgroundClip: 'text', color: 'transparent' }}>
          Photos
        </span>
      </h1>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Filter Photos
      </button>

      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleFilterApply}
      />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleSearch} // Call search on Enter key
          placeholder="Search for photos..."
          className="px-4 py-2 border rounded"
        />
      </div>

      {isLoading && <p className="mt-4 text-blue-500">Loading...</p>} {/* Loader */}

      {/* Render search results */}
      {searchResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Search Results:</h2>
          <div className="grid grid-cols-3 gap-4">
            {searchResults.map((photo, index) => (
              <div key={index} className="border rounded-lg shadow-md overflow-hidden">
                <img
                  src={`${photo.url}=w500-h500`}
                  alt={photo.filename}
                  className="w-full h-48 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render grouped photos */}
      <div>
        {Object.keys(groupedPhotos).map((dateKey) => (
          <div key={dateKey}>
            <h2 className="text-2xl font-semibold mb-4">{formatDateHeader(dateKey)}</h2>
            <div className="grid grid-cols-3 gap-4">
              {groupedPhotos[dateKey].map((photo, index) => (
                <div key={index} className="border rounded-lg shadow-md overflow-hidden">
                  <img
                    src={`${photo.url}=w500-h500`}
                    alt={photo.filename}
                    className="w-full h-48 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && !errorMessage && (
        <p className="mt-4 text-gray-600">No photos found in your Google account for the selected date range.</p>
      )}
    </div>
  );
};

export default Dashboard;
