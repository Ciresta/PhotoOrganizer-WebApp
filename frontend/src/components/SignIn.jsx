// src/components/SignIn.js
import React from 'react';
import backgroundImage from '../assets/images/signin-bg.svg';
import googleLogo from '../assets/images/google.svg';

const SignIn = ({ onSignIn }) => {
  return (
    <div className="bg-white mt-10 font-inter max-w-full h-screen flex flex-col items-center justify-start space-y-10 p-10">
      <div className="flex justify-center items-center">
        <div
          className="relative bg-cover bg-center w-[600px] h-[400px] rounded-lg shadow-lg"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute mt-60 inset-0 bg-black bg-opacity-0 rounded-lg flex flex-col justify-center items-center text-center px-6">
            <p className="text-white mb-4">
              Sign-In with Google to manage your Photos
            </p>
            <button
              onClick={onSignIn}
              className="flex items-center space-x-2 border border-white py-2 px-4 rounded-full hover:bg-white hover:bg-opacity-10"
            >
              <img src={googleLogo} alt="Google Logo" className="w-6 h-6" />
              <span className="font-medium text-sm text-white">Sign-In with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
