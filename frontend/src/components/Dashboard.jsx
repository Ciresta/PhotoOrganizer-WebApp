// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [photos, setPhotos] = useState([]); // Store photos from Google Photos
  const [errorMessage, setErrorMessage] = useState(''); // Store error message if any

  useEffect(() => {
    // Function to fetch photos
    const fetchPhotos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Call API to get photos
        const response = await axios.get('http://localhost:5000/photos', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPhotos(response.data); // Set retrieved photos
      } catch (error) {
        console.error('Error fetching photos:', error);
        setErrorMessage('Failed to load photos. Please try again.');
      }
    };

    // Fetch the photos once component is mounted
    fetchPhotos();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Your Google Photos</h1>

      {/* Display error message if any */}
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      {/* Display photos in a grid */}
      <div className="grid grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="border rounded-lg shadow-md overflow-hidden">
            <img
              src={`${photo.url}=w500-h500`} // Resize image using Google Photos URL params
              alt={photo.filename}
              className="w-full h-48 object-cover"
            />
          </div>
        ))}
      </div>

      {/* If no photos are found */}
      {photos.length === 0 && !errorMessage && (
        <p className="mt-4 text-gray-600">No photos found in your Google account.</p>
      )}
    </div>
  );
};

export default Dashboard;
