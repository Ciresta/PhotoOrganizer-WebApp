// FilterButton.js
import React from 'react';
import filterIcon from '../assets/images/filter.svg';

const FilterButton = ({ onClick }) => {
  return (
    <a
      href="#"
      onClick={onClick}
      className="ml-4 flex items-center space-x-1 text-gray-700 text-base"
    >
      <img src={filterIcon} alt="Filter" className="w-7 h-7" />
      <span className="text-base">Filters</span>
    </a>
  );
};

export default FilterButton;
