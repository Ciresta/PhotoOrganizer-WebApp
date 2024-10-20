import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSignOutAlt } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/user/profile');
      setUser(response.data); // Store user data in state
      setLoading(false); // Set loading to false
    } catch (error) {
      console.error('Error fetching user data:', error.response ? error.response.data : error.message);
      setLoading(false); // Set loading to false even on error
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleSignOut = () => {
    // Function to handle Google sign out
    window.location.href = 'http://localhost:5000/auth/google/logout';
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      {user ? (
        <div className="flex flex-col items-center">
          <img
            src={user.profilePic || 'path/to/fallback/image.png'} // Fallback image in case of null
            alt="Profile"
            className="w-24 h-24 rounded-full mb-4"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = 'path/to/fallback/image.png'; // Set fallback image if loading fails
            }}
          />
          <h2 className="text-xl font-semibold mb-2">{user.name}</h2>
          <p className="text-gray-600 mb-1">Email: {user.email}</p>
          {user.birthday && (
            <p className="text-gray-600 mb-1">DOB: {user.birthday}</p>
          )}
          <button
            onClick={handleSignOut}
            className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"
          >
            <FaSignOutAlt className="mr-2" />
            Sign Out
          </button>
        </div>
      ) : (
        <div>Error loading profile data</div>
      )}
    </div>
  );
};

export default Profile;
