import React, { useState, useCallback } from 'react';
import axios from 'axios';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false); // New state to track drag over

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      addFileToUploaded(selectedFile);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false); // Reset drag over state
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFileToUploaded(files[0]);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true); // Set drag over state
  };

  const handleDragLeave = () => {
    setIsDragOver(false); // Reset drag over state when drag leaves
  };

  const addFileToUploaded = (selectedFile) => {
    const newFile = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    };
    setUploadedFiles([...uploadedFiles, newFile]);
    setFile(selectedFile);
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select a file before uploading.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post('http://localhost:5000/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedFile = {
        url: response.data.url,
        name: response.data.filename,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
      };

      setUploadedFiles((prev) => prev.map((f) => f.name === uploadedFile.name ? uploadedFile : f));
      setFile(null);
      setSuccessPopupVisible(true);

      setTimeout(() => {
        setSuccessPopupVisible(false);
        window.location.href = "/home";
      }, 2000);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage("Error uploading file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full h-screen flex justify-center items-start space-x-8 p-10" 
         onDragOver={handleDragOver} 
         onDrop={handleDrop}
         onDragLeave={handleDragLeave}> {/* Handle drag leave */}
      <div className="w-1/2">
        <div className={`border-4 border-dashed rounded-lg p-12 flex flex-col items-center justify-center h-[600px] ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-[#f2f3f8]'}`}>
          <div className="mb-6">
            <i className="fas fa-folder-open text-yellow-500 text-8xl"></i>
          </div>
          <p className="text-gray-600 text-lg mb-3">Upload files here</p>
          <input type="file" onChange={handleFileChange} className="mb-4" />
          {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
        </div>
      </div>

      <div className="w-1/2">
        <table className="table-auto w-full text-left">
          <thead>
            <tr className="text-gray-600 text-lg">
              <th className="py-3">Name</th>
              <th className="py-3">Size</th>
              <th className="py-3">Type</th>
              <th className="py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file, index) => (
                <tr key={index} className="border-t">
                  <td className="py-4">
                    <p className="font-medium text-lg">{file.name}</p>
                  </td>
                  <td className="py-4 text-lg">{(file.size / 1024).toFixed(2)} KB</td>
                  <td className="py-4 text-lg">{file.type}</td>
                  <td className="py-4">
                    <button 
                      onClick={() => handleRemoveFile(index)} 
                      className="text-red-500 text-lg"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">No files uploaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        <button 
          onClick={handleUpload} 
          className={`bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? (
            <span>
              Uploading
              <span className="animate-pulse">...</span>
            </span>
          ) : (
            "Upload File"
          )}
        </button>
      </div>

      {successPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold">Images uploaded successfully!</h2>
            <p>Please wait, we are redirecting to the home screen...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
