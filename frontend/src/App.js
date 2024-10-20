// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload'; // Import the Upload component
import axios from 'axios';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set auth header globally
      window.history.replaceState({}, document.title, window.location.pathname); 
    } else {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    }
  }, []);

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
    localStorage.removeItem('token');
    axios.defaults.headers.common['Authorization'] = ''; // Remove the auth header
  };

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <p className="text-2xl font-semibold">Hang on, you're almost there...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <SignIn onSignIn={handleSignIn} />} />
            <Route path="/home" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/upload" element={isAuthenticated ? <Upload /> : <Navigate to="/" />} /> {/* Add upload route */}
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;
