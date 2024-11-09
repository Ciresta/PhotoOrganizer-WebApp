import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterModal from './DateFilter';
import ImageViewer from './ImageViewer'; // Import ImageViewer component
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import filterIcon from '../assets/images/filter.svg';
import searchIcon from '../assets/images/search.svg';

const Dashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // State for selected photo

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
      console.log(response.data);
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



  const groupPhotosByDate = (photos) => {
    const grouped = {};
    photos.forEach(photo => {
      // Check for creationTime
      const photoDate = photo.creationTime ? parseISO(photo.creationTime) : null;
      if (!photoDate || isNaN(photoDate)) {
        console.error('Missing or invalid creationTime for photo:', photo);
        return;
      }
  
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

        const response = await axios.post('http://localhost:5000/searchPhotos', {
          searchTerm,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSearchResults(response.data); // Update search results
      } catch (error) {
        console.error('Error searching photos:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'Failed to search photos. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePhotoClick = async (photoId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    try {
      // Fetch photo details along with custom tags using Google Photo ID directly
      const response = await axios.get(`http://localhost:5000/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { photoDetails, customTags } = response.data;

      // Combine photo details with custom tags for ImageViewer
      const photoWithTags = { ...photoDetails, tags: customTags || [] };
      setSelectedPhoto(photoWithTags); // Set photo with tags for ImageViewer
    } catch (error) {
      console.error('Error fetching photo details:', error.response || error);
      setErrorMessage('Failed to load photo details. Please try again.');
    }
  };

  const groupedPhotos = groupPhotosByDate(photos);

  return (
    <div className="p-8">
      <div className='grid grid-cols-2 justify-end items-end'>
        <h1 className="text-4xl font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', color: '#202124' }}>
          Welcome to Your Workspace 😄
        </h1>

        <a
          onClick={() => setIsModalOpen(true)}
          className="ml-40 flex space-x-1 cursor-pointer text-gray-700 text-base absolute left-[50rem] top-[25px]"
        >
          <img src={filterIcon} alt="Filter" className="w-7 h-7" />
          <span className="text-base">Filters</span>
        </a>
      </div>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      {/* <button
        onClick={() => setIsModalOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Filter Photos
      </button> */}

      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleFilterApply}
      />

      {/* Search Input */}
      <div className="relative w-[57rem] absolute top-[-140px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleSearch} // Call search on Enter key
          placeholder='Search "Food"'
          className="w-full bg-[#f2f3f8] rounded-full py-2 pl-5 pr-10 focus:outline-none text-gray-500"
        />
        <img src={searchIcon} alt="Search" className="absolute right-4 top-2 w-4 h-4" />
      </div>

      {isLoading && <p className="mt-4 text-blue-500">Loading...</p>} {/* Loader */}

      {/* Render search results */}
      {searchResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Search Results:</h2>
          <div className="grid grid-cols-3 gap-4">
            {searchResults.map((photo, index) => (
              <div
                key={index}
                className="border rounded-lg shadow-md overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)} // Open ImageViewer on click
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full h-48 object-cover"
                />
                <p className="text-center mt-2">{photo.filename}</p>
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
              {groupedPhotos[dateKey].map((photo) => (
                <div
                  key={photo.id}
                  className="border rounded-lg shadow-md overflow-hidden cursor-pointer"
                  onClick={() => handlePhotoClick(photo.id)} // Use the photo ID here
                >
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

      {/* ImageViewer for selected photo */}
      {selectedPhoto && (
        <ImageViewer
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)} // Close ImageViewer
        />
      )}
    </div>
  );
};

export default Dashboard;
