import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { FaFolderOpen, FaTrashAlt } from 'react-icons/fa';

const Upload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [tagInputs, setTagInputs] = useState([]); // State for tag inputs for each file

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      addFilesToUploaded(selectedFiles);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFilesToUploaded(files);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const addFilesToUploaded = (selectedFiles) => {
    const newFiles = selectedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      customTags: [], // Initialize custom tags for each file
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setTagInputs((prev) => [...prev, ""]); // Initialize tag input for each new file
    setErrorMessage(null);
  };

  const handleAddTag = (index) => {
    const newTag = tagInputs[index].trim();
    if (newTag === "") return;

    const updatedFiles = [...uploadedFiles];
    updatedFiles[index].customTags.push(newTag); // Add the new tag to the specific file's tags
    setUploadedFiles(updatedFiles);

    // Clear the specific input field after adding
    setTagInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = ""; // Reset the input field for this file
      return newInputs;
    });
  };

  const handleRemoveTag = (fileIndex, tagIndex) => {
    const updatedFiles = [...uploadedFiles];
    updatedFiles[fileIndex].customTags.splice(tagIndex, 1); // Remove the tag from the specific file
    setUploadedFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      setErrorMessage("Please select files before uploading.");
      return;
    }
  
    setLoading(true);
    try {
      const formData = new FormData();
  
      uploadedFiles.forEach((fileObj) => {
        formData.append('photos', fileObj.file);
      });
  
      // Append customTags as a JSON array to ensure proper parsing on the server
      const tagsArray = uploadedFiles.map(file => file.customTags);
      formData.append('customTags', JSON.stringify(tagsArray));
  
      const response = await axios.post('http://localhost:5000/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      console.log('Upload response:', response.data);
  
      setSuccessPopupVisible(true);
      setTimeout(() => {
        setSuccessPopupVisible(false);
        window.location.href = "/home";
      }, 2000);
  
    } catch (error) {
      console.error("Error uploading files:", error);
      setErrorMessage("Error uploading files. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    setTagInputs(tagInputs.filter((_, i) => i !== index)); // Remove the associated input
  };

  return (
    <div className="w-full h-screen flex justify-center items-start space-x-8 p-10" 
         onDragOver={handleDragOver} 
         onDrop={handleDrop}
         onDragLeave={handleDragLeave}>
      <div className="w-1/2">
        <div className={`border-4 border-dashed rounded-lg p-12 flex flex-col items-center justify-center h-[600px] ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-[#f2f3f8]'}`}>
          <div className="mb-6">
            <FaFolderOpen className="text-yellow-500 text-8xl" />
          </div>
          <p className="text-gray-600 text-lg mb-3">Drag and Drop Images here</p>
          or
          <input 
            type="file" 
            onChange={handleFileChange} 
            className="mb-4" 
            multiple 
          />
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
              <th className="py-3">Tags</th>
              <th className="py-3">Actions</th>
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
                    <ul>
                      {file.customTags.map((tag, tagIndex) => (
                        <li key={tagIndex} className="flex items-center rounded-lg bg-gray-200">
                          <span className="text-blue-500 ml-2">{tag}</span>
                          <button onClick={() => handleRemoveTag(index, tagIndex)} className="text-red-500 text-lg ml-8">
                            &times; {/* X icon for removing tag */}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex mt-2">
                      <input
                        type="text"
                        value={tagInputs[index] || ""}
                        onChange={(e) => {
                          const newInputs = [...tagInputs];
                          newInputs[index] = e.target.value; // Update the specific input
                          setTagInputs(newInputs);
                        }}
                        placeholder="Add tag"
                        className="border border-gray-300 rounded-l px-2 py-1 text-gray-800"
                      />
                      <button
                        onClick={() => handleAddTag(index)}
                        className="bg-blue-500 text-white px-3 rounded-r"
                      >
                        Add
                      </button>
                    </div>
                  </td>
                  <td className="py-4">
                    <button 
                      onClick={() => handleRemoveFile(index)} 
                      className="text-red-500 text-lg"
                      title="Delete File"
                    >
                      <FaTrashAlt className="text-black" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">No files uploaded yet.</td>
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
            "Upload Files"
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
