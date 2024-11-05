import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faTimes } from '@fortawesome/free-solid-svg-icons';

const ImageViewer = ({ photo, onClose }) => {
  const [newTag, setNewTag] = useState('');

  if (!photo) return null;

  const handleTagRemove = (tag) => {
    // Placeholder function to remove tag - implement this with backend API call if necessary
    console.log(`Removing tag: ${tag}`);
  };

  const handleAddTag = () => {
    // Placeholder function to add tag - implement this with backend API call if necessary
    console.log(`Adding tag: ${newTag}`);
    setNewTag(''); // Clear input field after adding
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-3/4 h-3/4 overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 rounded-full p-2 focus:outline-none"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>

        {/* Image and Details Section */}
        <div className="flex h-full">
          {/* Image Display */}
          <div className="w-2/3 h-full bg-gray-200 flex items-center justify-center">
            <img
              src={`${photo.url}=w800-h800`}
              alt={photo.filename}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Details Section */}
          <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto">
            <h2 className="text-2xl font-medium text-gray-800 mb-4">{photo.filename}</h2>
            <p className="text-gray-600 mb-2"><strong>Date:</strong> {new Date(photo.creationTime).toLocaleDateString()}</p>
            <p className="text-gray-600 mb-2"><strong>Resolution:</strong> {photo.width} x {photo.height}</p>
            {photo.size && <p className="text-gray-600 mb-2"><strong>Size:</strong> {(photo.size / 1024).toFixed(2)} KB</p>}
            <p className="text-gray-600 mb-2"><strong>Type:</strong> {photo.mimeType || 'Unknown'}</p>
            <p className="text-gray-600 mb-4"><strong>Description:</strong> {photo.description}</p>
            <p className="text-gray-600 mb-2"><strong>Location:</strong> {photo.location || 'Not Available'}</p>

            {/* Custom Tags Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Custom Tags</h3>
              {photo.tags && photo.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {photo.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full shadow hover:bg-blue-200 transition duration-200 ease-in-out"
                    >
                      <FontAwesomeIcon icon={faTag} className="mr-2" />
                      <span>{tag}</span>
                      <button
                        onClick={() => handleTagRemove(tag)}
                        className="ml-2 text-red-500 hover:text-red-600 focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-4">No tags available.</p>
              )}

              {/* Add Tag Section */}
              <div className="flex items-center mt-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!newTag}
                  className={`px-4 py-2 rounded-r-md bg-blue-500 text-white font-medium focus:outline-none transition-all ${
                    newTag ? 'hover:bg-blue-600' : 'opacity-50 cursor-not-allowed'
                  }`}
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
