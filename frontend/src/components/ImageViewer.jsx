import React from 'react';

const ImageViewer = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-3/4 h-3/4 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-gray-600 hover:bg-gray-800 rounded-full p-2 focus:outline-none"
        >
          ✕
        </button>

        {/* Image Section */}
        <div className="flex h-full">
          <img
            src={`${photo.url}=w800-h800`} // High-resolution image
            alt={photo.filename}
            className="w-2/3 h-full object-cover"
          />

          {/* Details Section */}
          <div className="w-1/3 bg-gray-50 p-4 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{photo.filename}</h2>
            
            {/* Photo Information */}
            <p className="text-gray-700 mb-2"><strong>Date:</strong> {new Date(photo.creationTime).toLocaleDateString()}</p>
            <p className="text-gray-700 mb-2"><strong>Resolution:</strong> {photo.width} x {photo.height}</p>
            <p className="text-gray-700 mb-2"><strong>Size:</strong> {(photo.size / 1024).toFixed(2)} KB</p>
            <p className="text-gray-700 mb-2"><strong>Type:</strong> {photo.type || 'Unknown'}</p>

            {/* Location and Additional Details */}
            <p className="text-gray-700 mb-2"><strong>Location:</strong> {photo.location || 'Not Available'}</p>

            {/* Custom Tags */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Custom Tags</h3>
              {photo.tags && photo.tags.length > 0 ? (
                <ul className="list-disc list-inside mb-4">
                  {photo.tags.map((tag, index) => (
                    <li key={index} className="text-gray-600">{tag}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 mb-4">No tags available.</p>
              )}

              {/* Add Tag Input (UI Only, No Functionality Yet) */}
              <div>
                <input
                  type="text"
                  placeholder="Add a tag..."
                  className="w-full px-3 py-2 border rounded mb-2"
                />
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled // This button is disabled until functionality is implemented
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
