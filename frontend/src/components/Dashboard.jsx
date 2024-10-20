import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterModal from './DateFilter';

const Dashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPhotos = async (fromDate, toDate) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`http://localhost:5000/photos`, {
        params: {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setErrorMessage('Failed to load photos. Please try again.');
    }
  };

  useEffect(() => {
    fetchPhotos(); // Fetch all photos initially
  }, []);

  const handleFilterApply = (fromDate, toDate) => {
    fetchPhotos(fromDate, toDate);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Your Google Photos</h1>

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

      <div className="grid grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="border rounded-lg shadow-md overflow-hidden">
            <img
              src={`${photo.url}=w500-h500`} 
              alt={photo.filename}
              className="w-full h-48 object-cover"
            />
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
