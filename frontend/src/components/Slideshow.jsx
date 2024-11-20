import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLink } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.min.css'; // Import Swiper styles

const Slideshow = () => {
  const [slideshows, setSlideshows] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlideshows = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMessage('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/displayslideshows', {
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

  if (loading) {
    return <div className="text-center mt-10 text-xl">Loading slideshows...</div>;
  }

  if (errorMessage) {
    return <div className="text-red-500 text-center mt-10">{errorMessage}</div>;
  }

  if (slideshows.length === 0) {
    return <div className="text-center mt-10 text-xl text-gray-500">No slideshows found.</div>;
  }

  const getSlideshowLink = (slideshowId) => {
    const baseUrl = `${window.location.origin}/slideshow/${slideshowId}`;
    navigator.clipboard.writeText(baseUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="slideshow-container p-8 max-w-screen-xl mx-auto">
      {slideshows.map((slideshow) => (
        <div key={slideshow._id} className="slideshow-section mb-12 border-2 border-gray-300 p-6 rounded-lg shadow-lg">
          {/* Slideshow Name and Get Link Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-semibold text-gray-800">{slideshow.name}</h2>
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition"
              onClick={() => getSlideshowLink(slideshow._id)}
            >
              <FaLink /> Get Link
            </button>
          </div>

          {/* Swiper Carousel */}
          <Swiper
            spaceBetween={20}
            slidesPerView={1}
            autoplay={{ delay: 3000 }}
            pagination={{ clickable: true }}
            navigation
            loop
            className="swiper-container"
          >
            {slideshow.photoUrls?.length > 0 ? (
              slideshow.photoUrls.map((photoUrl, index) => (
                <SwiperSlide key={index} className="relative">
                  <img
                    src={photoUrl}
                    alt={`Slideshow Photo ${index + 1}`}
                    className="w-full h-96 object-cover rounded-lg shadow-md"
                  />
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black opacity-0 hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xl">View Photo</span>
                  </div>
                </SwiperSlide>
              ))
            ) : (
              <div className="text-gray-500">No photos available for this slideshow.</div>
            )}
          </Swiper>
        </div>
      ))}
    </div>
  );
};

export default Slideshow;
