import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterModal from './DateFilter'; 
import { format, isToday, isYesterday, parseISO } from 'date-fns'; // Using date-fns for date manipulation

const Dashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPhotos = async (fromDate, toDate, location) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }

      console.log('Token retrieved:', token); // Debugging token retrieval

      const response = await axios.get(`http://localhost:5000/photos`, {
        params: {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          location: location || undefined, // Pass location to API
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response:', response.data); // Debugging API response
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setErrorMessage('Failed to load photos. Please try again.');
    }
  };

  useEffect(() => {
    fetchPhotos(); 
  }, []);

  useEffect(() => {
    if (photos.length > 0) {
      console.log('Photos data:', photos); // Debugging photos structure
    }
  }, [photos]);

  const handleFilterApply = (fromDate, toDate, location) => {
    fetchPhotos(fromDate, toDate, location); // Update this to include location
  };

  // Helper function to group photos by date
  const groupPhotosByDate = (photos) => {
    const grouped = {};

    photos.forEach(photo => {
      if (!photo.creationTime) {
        console.error('Missing creationTime for photo:', photo); // Debug missing creationTime
        return;
      }

      try {
        const photoDate = parseISO(photo.creationTime); // Try to parse the date
        if (isNaN(photoDate)) {
          console.error('Invalid date format:', photo.creationTime); // Handle invalid date
          return;
        }
        
        const dateKey = format(photoDate, 'yyyy-MM-dd'); // Format the date for grouping
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(photo);
      } catch (error) {
        console.error('Error parsing creationTime:', error); // Handle any parsing errors
      }
    });

    return grouped;
  };

  // Helper function to format date headers
  const formatDateHeader = (dateString) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, MMM d'); // Example: 'Sat, Oct 19'
  };

  // Group photos by date
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

      {/* Render grouped photos */}
      <div>
        {Object.keys(groupedPhotos).map((dateKey) => (
          <div key={dateKey}>
            {/* Date header */}
            <h2 className="text-2xl font-semibold mb-4">
              {formatDateHeader(dateKey)}
            </h2>
            
            {/* Display photos for this date */}
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
