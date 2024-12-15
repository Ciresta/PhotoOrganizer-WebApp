import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLink, FaTrash } from 'react-icons/fa';
import Slider from 'react-slick';

const Slideshow = () => {
  const [slideshows, setSlideshows] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSlideshowId, setSelectedSlideshowId] = useState(null);
  const [deletionStatus, setDeletionStatus] = useState('');
  const [showEmbedInstructions, setShowEmbedInstructions] = useState(false);
  const [embedLink, setEmbedLink] = useState('');

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
    // Just pass the slideshowId instead of the full URL
    const baseLink = slideshowId; // e.g., 'workshop-79fd498a'
    navigator.clipboard.writeText(baseLink); // Copy only the slideshowId to clipboard
    setEmbedLink(baseLink); // Set the slideshowId as the embed link
    setShowEmbedInstructions(true); // Show the embed instructions modal
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

      setSlideshows((prevSlideshows) =>
        prevSlideshows.filter((slideshow) => slideshow.slideshowId !== selectedSlideshowId)
      );

      setIsDeleting(false);
      setSelectedSlideshowId(null);
      setDeletionStatus('Slideshow deleted successfully!');
      setTimeout(() => {
        setDeletionStatus('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting slideshow:', error);
      setDeletionStatus('Failed to delete slideshow. Please try again.');
      setTimeout(() => {
        setDeletionStatus('');
      }, 3000);
      setIsDeleting(false);
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
            key={slideshow.slideshowId}
            className="slideshow-card bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold">{slideshow.name}</h2>
              <div className="flex gap-2">
                <button
                  className="bg-white text-blue-500 py-2 px-4 rounded-full flex items-center gap-2 shadow hover:shadow-md hover:bg-blue-100 transition"
                  onClick={() => getSlideshowLink(slideshow.slideshowId)}
                >
                  <FaLink /> Get Link
                </button>
                <button
                  className="bg-red-500 text-white py-2 px-4 rounded-full flex items-center gap-2 shadow hover:shadow-md hover:bg-red-600 transition"
                  onClick={() => {
                    setSelectedSlideshowId(slideshow.slideshowId);
                    setIsDeleting(true);
                  }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>

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
                onClick={deleteSlideshow}
              >
                Yes, Delete
              </button>
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                onClick={() => setIsDeleting(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Instructions Modal */}
      {showEmbedInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">How to Embed This Slideshow</h3>
            <p className="mb-4">You can embed this slideshow on your website using the following HTML code:</p>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {`<script src="https://photoorganizer.netlify.app/embed.js"></script>
<div id="carousel-container" style="width: 100%; max-width: 800px; margin: auto;"></div>
<script>
    window.initSlideshow('${embedLink}', 'carousel-container');
</script>`}
            </pre>
            <button
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mt-4"
              onClick={() => setShowEmbedInstructions(false)}
            >
              Close
            </button>
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
