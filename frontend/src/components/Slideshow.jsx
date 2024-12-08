import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLink, FaTrash } from 'react-icons/fa';
import Slider from 'react-slick';

const Slideshow = () => {
  const [slideshows, setSlideshows] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // To show confirmation modal
  const [selectedSlideshowId, setSelectedSlideshowId] = useState(null); // Store the selected slideshow ID for deletion
  const [deletionStatus, setDeletionStatus] = useState(''); // To handle success/failure feedback

  // Fetch slideshows from the API
  useEffect(() => {
    const fetchSlideshows = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMessage('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('https://photo-org-app.onrender.com/displayslideshows', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSlideshows(response.data.slideshows);
        setLoading(false);
      } catch (error) {
        setErrorMessage('Failed to load slideshows. Please try again.');
        setLoading(false);
      }
    };

    fetchSlideshows();
  }, []);

  const getSlideshowLink = (slideshowId) => {
    const baseUrl = `${window.location.origin}/slideshow/${slideshowId}`;
    navigator.clipboard.writeText(baseUrl);
    alert('Link copied to clipboard!');
  };

  const deleteSlideshow = async () => {
    if (!selectedSlideshowId) {
      setErrorMessage('No slideshow selected for deletion.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    try {
      setDeletionStatus('Deleting...');
      const response = await axios.delete(`https://photo-org-app.onrender.com/slideshows/${selectedSlideshowId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response after delete:', response.data);

      // Remove the deleted slideshow from the state
      setSlideshows((prevSlideshows) =>
        prevSlideshows.filter((slideshow) => slideshow.slideshowId !== selectedSlideshowId)
      );

      setIsDeleting(false); // Close confirmation modal
      setSelectedSlideshowId(null); // Reset selected slideshow
      setDeletionStatus('Slideshow deleted successfully!');
      setTimeout(() => {
        setDeletionStatus('');
      }, 3000); // Reset after 3 seconds
    } catch (error) {
      console.error('Error deleting slideshow:', error);
      setDeletionStatus('Failed to delete slideshow. Please try again.');
      setTimeout(() => {
        setDeletionStatus('');
      }, 3000); // Reset after 3 seconds
      setIsDeleting(false); // Close confirmation modal
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  if (loading) {
    return <div className="text-center mt-10 text-xl font-semibold text-blue-500">Loading slideshows...</div>;
  }

  if (errorMessage) {
    return <div className="text-red-500 text-center mt-10 font-bold">{errorMessage}</div>;
  }

  if (slideshows.length === 0) {
    return <div className="text-center mt-10 text-xl text-gray-500">No slideshows found.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mt-10 mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slideshows.map((slideshow) => (
          <div
            key={slideshow.slideshowId}  // Use slideshowId for unique key
            className="slideshow-card bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold">{slideshow.name}</h2>
              <div className="flex gap-2">
                <button
                  className="bg-white text-blue-500 py-2 px-4 rounded-full flex items-center gap-2 shadow hover:shadow-md hover:bg-blue-100 transition"
                  onClick={() => getSlideshowLink(slideshow.slideshowId)}  // Use slideshowId here
                >
                  <FaLink /> Get Link
                </button>
                <button
                  className="bg-red-500 text-white py-2 px-4 rounded-full flex items-center gap-2 shadow hover:shadow-md hover:bg-red-600 transition"
                  onClick={() => {
                    setSelectedSlideshowId(slideshow.slideshowId);  // Ensure this sets the correct ID for deletion
                    setIsDeleting(true); // Show confirmation modal
                  }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>

            {/* Carousel Section */}
            <div className="p-4">
              <Slider {...sliderSettings}>
                {slideshow.photoUrls?.length > 0 ? (
                  slideshow.photoUrls.map((photoUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photoUrl}
                        alt={`Slideshow Photo ${index + 1}`}
                        className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 flex items-center justify-center h-64">
                    No photos available for this slideshow.
                  </div>
                )}
              </Slider>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Are you sure you want to delete this slideshow?</h3>
            <div className="flex gap-4">
              <button
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                onClick={deleteSlideshow} // Directly call delete function
              >
                Yes, Delete
              </button>
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                onClick={() => setIsDeleting(false)} // Close confirmation modal
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Status Message */}
      {deletionStatus && (
        <div className="mt-4 text-center text-lg font-semibold text-green-500">
          {deletionStatus}
        </div>
      )}
    </div>
  );
};

export default Slideshow;
