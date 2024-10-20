import React from 'react';
import DateRangePicker from './DateRangePicker';

const FilterModal = ({ isVisible, onClose, fromDate, toDate, setFromDate, setToDate, onApply }) => {
  if (!isVisible) return null; // Don't render the modal if not visible

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-xl font-bold mb-4">Select Date Range</h2>
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          onApply={() => {
            onApply(); // Call onApply to fetch photos in Dashboard
            onClose(); // Close the modal
          }}
        />
        <button onClick={onClose} className="mt-4 text-red-500">
          Closes
        </button>
      </div>
    </div>
  );
};

export default FilterModal;
