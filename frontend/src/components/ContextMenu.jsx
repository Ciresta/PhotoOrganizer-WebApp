// ContextMenu.js
import React from 'react';

const ContextMenu = ({ x, y, onClose, onAction }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        zIndex: 1000,
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        overflow: 'hidden',
        minWidth: '200px',
      }}
      onMouseLeave={onClose}
      className="context-menu"
    >
      <ul className="text-gray-800">
        <li
          className="p-4 hover:bg-gray-100 cursor-pointer"
          onClick={() => onAction('viewDetails')}
        >
          View Details
        </li>
        <li
          className="p-4 hover:bg-gray-100 cursor-pointer"
          onClick={() => onAction('download')}
        >
          Download
        </li>
        <li
          className="p-4 hover:bg-gray-100 cursor-pointer"
          onClick={() => onAction('share')}
        >
          Share
        </li>
      </ul>
    </div>
  );
};

export default ContextMenu;
