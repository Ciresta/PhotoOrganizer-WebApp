// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload'; 
import Profile from './components/Profile'; 
import axios from 'axios';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null); // State to store user data

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set auth header globally
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchUserData(token); // Fetch user data after setting the token
    } else {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        fetchUserData(storedToken); // Fetch user data with stored token
      }
    }
  }, []);

  // Function to fetch user data
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data); // Set user data
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsAuthenticated(false); // If there's an error, reset authentication state
    }
  };

  const handleSignIn = async () => {
    setLoading(true); 
    try {
      const response = await axios.get('http://localhost:5000/auth/google');
      const googleAuthUrl = response.data.authUrl;
      window.location.href = googleAuthUrl; 
    } catch (error) {
      console.error('Error getting auth URL:', error);
      alert('Failed to retrieve authentication URL. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null); // Clear user data on logout
    localStorage.removeItem('token');
    axios.defaults.headers.common['Authorization'] = ''; // Remove the auth header
  };

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} user={user} /> {/* Pass user data to Navbar */}
        
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <p className="text-2xl font-semibold">Hang on, you're almost there...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <SignIn onSignIn={handleSignIn} />} />
            <Route path="/home" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/upload" element={isAuthenticated ? <Upload /> : <Navigate to="/" />} /> {/* Add upload route */}
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/" />} /> {/* Add profile route */}
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;
