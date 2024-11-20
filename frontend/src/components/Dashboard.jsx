import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterModal from './DateFilter';
import ImageViewer from './ImageViewer'; 
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import searchIcon from '../assets/images/search.svg';

const Dashboard = () => {
  const [photos, setPhotos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null); 
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isSlideshowModalOpen, setIsSlideshowModalOpen] = useState(false);
  const [slideshowName, setSlideshowName] = useState('');

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

  const handleFilterApply = (fromDate, toDate, location) => {
    fetchPhotos(fromDate, toDate, location);
  };

  const groupPhotosByDate = (photos) => {
    const grouped = {};
    photos.forEach(photo => {
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

  const saveSlideshow = async () => {
    if (!slideshowName.trim() || selectedPhotos.length === 0) {
      alert('Please provide a name and select at least one photo.');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }
  
      const response = await axios.post(
        'http://localhost:5000/slideshows',
        { name: slideshowName, photoIds: selectedPhotos },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      alert('Slideshow created successfully!');
      setIsSlideshowModalOpen(false); // Close modal
      setSelectedPhotos([]); // Reset selected photos
      setSlideshowName(''); // Clear slideshow name
    } catch (error) {
      console.error('Error saving slideshow:', error.response?.data || error.message);
      setErrorMessage('Failed to save slideshow. Please try again.');
    }
  };
  
  
  
  const handlePhotoClick = async (photoId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { photoDetails, customTags } = response.data;

      const photoWithTags = { ...photoDetails, tags: customTags || [] };
      setSelectedPhoto(photoWithTags); 
    } catch (error) {
      console.error('Error fetching photo details:', error.response || error);
      setErrorMessage('Failed to load photo details. Please try again.');
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const groupedPhotos = groupPhotosByDate(photos);

  return (
    <div className="p-8">
    <div className="grid grid-cols-2 justify-end items-end">
      <h1 className="text-4xl font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', color: '#202124' }}>
        Welcome to Your Workspace 😄
      </h1>
      <button
        onClick={() => setIsSlideshowModalOpen(true)}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Create Slideshow
      </button>
    </div>
  
    {errorMessage && <p className="text-red-500">{errorMessage}</p>}
  
    <FilterModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onApply={handleFilterApply}
    />
  
    <div className="relative w-[57rem] absolute top-[-130px]">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleSearch}
        placeholder='Search "Food"'
        className="w-full bg-[#f2f3f8] rounded-full py-2 pl-5 pr-10 focus:outline-none text-gray-500"
      />
      <img src={searchIcon} alt="Search" className="absolute right-4 top-2 w-4 h-4" />
    </div>
  
    {isLoading && <p className="mt-4 text-blue-500">Loading...</p>}
  
    {searchResults.length > 0 ? (
      // Display search results
      <div>
        <h2 className="text-2xl font-semibold mb-4">Search Results:</h2>
        <div className="grid grid-cols-3 gap-4">
          {searchResults.map((photo, index) => (
            <div
              key={index}
              className="border rounded-lg shadow-md overflow-hidden cursor-pointer"
              onClick={() => handlePhotoClick(photo.id)}
            >
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-48 object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    ) : (
      // Display normal photos if there are no search results
      Object.keys(groupedPhotos).map((dateKey) => (
        <div key={dateKey}>
          <h2 className="text-2xl font-semibold mb-4">{formatDateHeader(dateKey)}</h2>
          <div className="grid grid-cols-3 gap-4">
            {groupedPhotos[dateKey].map((photo) => (
              <div
                key={photo.id}
                className="border rounded-lg shadow-md overflow-hidden cursor-pointer"
                onClick={() => handlePhotoClick(photo.id)}
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
      ))
    )}
  
    {isSlideshowModalOpen && (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
          <h2 className="text-xl font-semibold mb-4">Create Slideshow</h2>
          <input
            type="text"
            value={slideshowName}
            onChange={(e) => setSlideshowName(e.target.value)}
            placeholder="Enter slideshow name"
            className="w-full border p-2 mb-4 rounded"
          />
          <div className="grid grid-cols-3 gap-4 max-h-64 overflow-y-scroll">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`border rounded-lg shadow-md overflow-hidden cursor-pointer ${selectedPhotos.includes(photo.id) ? 'border-blue-500' : ''
                  }`}
                onClick={() => togglePhotoSelection(photo.id)}
              >
                <img src={`${photo.url}=w200-h200`} alt={photo.filename} className="w-full h-32 object-cover" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button onClick={() => setIsSlideshowModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
              Cancel
            </button>
            <button onClick={saveSlideshow} className="px-4 py-2 bg-blue-500 text-white rounded">
              Save
            </button>
          </div>
        </div>
      </div>
    )}
  
    {photos.length === 0 && !errorMessage && (
      <p className="mt-4 text-gray-600">No photos found in your Google account for the selected date range.</p>
    )}
  
    {selectedPhoto && (
      <ImageViewer
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    )}
  </div>
  
  );
};

export default Dashboard;
