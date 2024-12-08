import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterModal from './DateFilter';
import ImageViewer from './ImageViewer';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import searchIcon from '../assets/images/search.svg';
import filterIcon from '../assets/images/filter.svg';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


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
  const [slideshowSearchTerm, setSlideshowSearchTerm] = useState(''); // For search in slideshow modal
  const [slideshowSearchResults, setSlideshowSearchResults] = useState([]); // Search results for slideshow modal

  const fetchPhotos = async (fromDate, toDate, location) => {
    console.log('Fetching photos with:', { fromDate, toDate, location });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }

      const response = await axios.get('https://photo-org-app.onrender.com/photos', {
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

        const response = await axios.post('https://photo-org-app.onrender.com/searchPhotos', {
          searchTerm,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultsWithCorrectUrls = response.data.map((photo) => ({
          ...photo,
          url: photo.url.includes('http') ? photo.url : `https://photo-org-app.onrender.com/${photo.url}`,
        }));

        setSearchResults(resultsWithCorrectUrls);
      } catch (error) {
        console.error('Error searching photos:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'Failed to search photos. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSearchInSlideshowModal = async (e) => {
    if (e.key === 'Enter') {
      setIsLoading(true);
      setSlideshowSearchResults([]); // Clear previous results in the slideshow modal

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMessage('No authentication token found. Please log in.');
          return;
        }

        const response = await axios.post('https://photo-org-app.onrender.com/searchPhotos', {
          searchTerm: slideshowSearchTerm,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultsWithCorrectUrls = response.data.map((photo) => ({
          ...photo,
          url: photo.url.includes('http') ? photo.url : `https://photo-org-app.onrender.com/${photo.url}`,
        }));

        setSlideshowSearchResults(resultsWithCorrectUrls);
      } catch (error) {
        console.error('Error searching photos in slideshow:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'Failed to search photos. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const saveSlideshow = async () => {
    if (!slideshowName.trim() || selectedPhotos.length < 2) {
      alert('Please provide a name and select at least two photo.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }

      const response = await axios.post(
        'https://photo-org-app.onrender.com/slideshows',
        { name: slideshowName, photoIds: selectedPhotos },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Slideshow created successfully!');
      setIsSlideshowModalOpen(false);
      setSelectedPhotos([]);
      setSlideshowName('');
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
      const response = await axios.get(`https://photo-org-app.onrender.com/photos/${photoId}`, {
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
        <h1 className="text-4xl invisible font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', color: '#202124' }}>
          Welcome to Your Workspace 😄
        </h1>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setIsSlideshowModalOpen(true);
          }}
          className="flex items-center space-x-1 text-gray-700 text-base absolute right-[113px] top-[28px]"
        >
          <FontAwesomeIcon icon={faStar} className="w-5 h-5 text-gray-700" />
          <span className="text-base">Create</span>
        </a>
      </div>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-lg text-gray-800 relative right-[-53rem] top-[-131px]  flex items-center"
      >
        <img
          src={filterIcon} // Replace with the actual path to your image
          alt="Filter Icon"
          className="w-8 h-8"
        />
        Filter
      </button>

      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleFilterApply}
      />

      <div className="relative w-[50rem] absolute top-[-173px]">
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-4xl w-full relative">

            {/* Close Button */}
            <button
              onClick={() => setIsSlideshowModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none text-2xl"
            >
              &times;
            </button>

            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Create Slideshow</h2>

            {/* Slideshow Name Input */}
            <input
              type="text"
              value={slideshowName}
              onChange={(e) => setSlideshowName(e.target.value)}
              placeholder="Enter slideshow name"
              className="w-full p-3 mb-6 text-lg rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                value={slideshowSearchTerm}
                onChange={(e) => setSlideshowSearchTerm(e.target.value)}
                onKeyPress={handleSearchInSlideshowModal}
                placeholder="Search photos..."
                className="w-full bg-[#f8f9fa] text-gray-700 pl-12 pr-4 py-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <img src={searchIcon} alt="Search" className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-64 overflow-y-auto">
              {slideshowSearchResults.length > 0
                ? slideshowSearchResults.map((photo) => (
                  <div
                    key={photo.id}
                    className={`border rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 transform hover:scale-105 ${selectedPhotos.includes(photo.id) ? 'border-blue-500 border-4' : ''}`}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    <img src={photo.url} alt={photo.filename} className="w-full h-40 object-cover" />
                  </div>
                ))
                : photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`border rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform duration-300 transform hover:scale-105 ${selectedPhotos.includes(photo.id) ? 'border-blue-500 border-4' : ''}`}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    <img src={photo.url} alt={photo.filename} className="w-full h-40 object-cover" />
                  </div>
                ))}
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={saveSlideshow}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              >
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
