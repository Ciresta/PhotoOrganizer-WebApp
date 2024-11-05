import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const FilterModal = ({ isOpen, onClose, onApply }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [location, setLocation] = useState(''); // New state for location

  const handleApply = () => {
    onApply(fromDate, toDate, location); // Include location in the apply callback
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg p-8 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out relative">
        
        {/* Close Icon in top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>

        <h2 className="text-2xl font-medium text-gray-800 mb-6">Filter Your Photos</h2>

        {/* Date Range Filter */}
        <div className="mb-6">
          <label className="block text-gray-600 text-sm font-medium mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-600 text-sm font-medium mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Location Filter */}
        <div className="mb-6">
          <label className="block text-gray-600 text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter location"
          />
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleApply} 
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
