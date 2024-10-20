import React, { useState } from 'react';

const FilterModal = ({ isOpen, onClose, onApply }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleApply = () => {
    onApply(fromDate, toDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl mb-4">Select Date Range</h2>
        <div className="mb-4">
          <label className="block mb-2">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded p x-2 py-1"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleApply} className="px-4 py-2 bg-blue-500 text-white rounded">Apply Filter</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
