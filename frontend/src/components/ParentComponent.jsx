import React, { useState } from 'react';
import FilterModal from './Filter';
import Dashboard from './Dashboard';

const ParentComponent = () => {
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({ fromDate: '', toDate: '' });

  // Function to handle filter application
  const handleApplyFilters = (selectedFilters) => {
    setFilters({
      fromDate: selectedFilters.fromDate,
      toDate: selectedFilters.toDate,
    });
    setIsFilterModalVisible(false); // Close modal
  };

  return (
    <div>
      <button
        onClick={() => setIsFilterModalVisible(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open Filter
      </button>

      {/* Render the FilterModal */}
      {isFilterModalVisible && (
        <FilterModal
          isVisible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          onApply={handleApplyFilters} // Pass the onApply function
        />
      )}

      {/* Pass the filters to the Dashboard component */}
      <Dashboard fromDate={filters.fromDate} toDate={filters.toDate} />
    </div>
  );
};

export default ParentComponent;
