import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import homeIcon from '../assets/images/home.svg';
import uploadIcon from '../assets/images/upload.svg';
import slideshowIcon from '../assets/images/slideshow.svg';
import signinIcon from '../assets/images/signuser.svg';
import searchIcon from '../assets/images/search.svg';
import filterIcon from '../assets/images/filter.svg'; 
import userProfileIcon from '../assets/images/signuser.svg'; // Use a different default profile image

const Navbar = ({ isAuthenticated, onLogout, user }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear token
    onLogout(); // Update authentication state in parent
  };

  return (
    <div className="w-full flex justify-between items-center mt-4">
      <div className="flex ml-10 items-center w-full max-w-4xl">
        <div className="relative w-full">
          <input
            type="text"
            placeholder='Search "Food"'
            className="w-full bg-[#f2f3f8] rounded-full py-2 pl-5 pr-10 focus:outline-none text-gray-500"
          />
          <img src={searchIcon} alt="Search" className="absolute right-4 top-2 w-4 h-4" />
        </div>

        {isAuthenticated && (
          <a href="#" className="ml-4 flex items-center space-x-1 text-gray-700 text-base">
            <img src={filterIcon} alt="Filter" className="w-7 h-7" />
            <span className="text-base">Filters</span>
          </a>
        )}
      </div>

      <div className="flex items-center mr-10 bg-[#F0F0FC] py-2 px-6 rounded-full space-x-8">
        <Link to="/" className="flex items-center space-x-1 text-gray-700 text-base">
          <img src={homeIcon} alt="Home" className="w-6 h-6" />
          <span className="text-base">Home</span>
        </Link>

        <Link to="/upload" className="flex items-center space-x-1 text-gray-700 text-base">
          <img src={uploadIcon} alt="Upload" className="w-8 h-8" />
          <span className="text-base">Upload</span>
        </Link>

        <a href="#" className="flex items-center space-x-1 text-gray-700 text-base">
          <img src={slideshowIcon} alt="Slideshow" className="w-5 h-5" />
          <span className="text-base">Slideshow</span>
        </a>

        {isAuthenticated ? (
          <div className="relative flex items-center space-x-1">
            <img
              src={user?.profilePic || userProfileIcon} // Use user's profile image or fallback
              alt="User Profile"
              className="w-7 h-7 rounded-full cursor-pointer"
              onClick={toggleDropdown} // Toggle dropdown on click
            />
            {dropdownVisible && (
              <div className="absolute right-0 mt-60 w-48 bg-white shadow-lg rounded-lg z-10">
                <ul className="py-2 ml-4">
            <span className="text-gray-700 text-base ">Hello,<br/> <span className='font-bold'>{user?.name || 'Guest'}</span></span> {/* Use optional chaining */}
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <Link to="/profile">Profile</Link> {/* Redirect to /profile */}
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={handleLogout} // Call logout on click
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
            {/* Greeting user with their name */}
          </div>
        ) : (
          <a href="#" className="flex items-center space-x-1 text-gray-700 text-base">
            <img src={signinIcon} alt="Sign-in" className="w-7 h-7" />
            <span className="text-base">Sign-in</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default Navbar;
