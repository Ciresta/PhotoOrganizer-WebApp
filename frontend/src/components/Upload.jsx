// src/components/Upload.js
import React from 'react';

const Upload = () => {
  return (
    <div className="w-full h-screen flex justify-center items-start space-x-8 p-10">
      {/* Left side: Upload box */}
      <div className="w-1/2">
        <div className="border-4 border-dashed border-gray-400 rounded-lg p-12 bg-[#f2f3f8] flex flex-col items-center justify-center h-[600px]">
          <div className="mb-6">
            <i className="fas fa-folder-open text-yellow-500 text-8xl"></i>
          </div>
          <p className="text-gray-600 text-lg mb-3">Upload files here</p>
          <p className="text-gray-500 text-lg">
            Drag & Drop or <a href="#" className="text-blue-500">Browse files</a>
          </p>
        </div>
      </div>

      {/* Right side: File list */}
      <div className="w-1/2">
        <table className="table-auto w-full text-left">
          <thead>
            <tr className="text-gray-600 text-lg">
              <th className="py-3">Image</th>
              <th className="py-3">Name</th>
              <th className="py-3">Date</th>
              <th className="py-3">Size</th>
              <th className="py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {/* Example Rows */}
            <tr className="border-t">
              <td className="py-4">
                <img src="https://placehold.co/80x80" alt="Uploaded File" className="rounded-lg w-20 h-20 object-cover" />
              </td>
              <td className="py-4">
                <p className="font-medium text-lg">File Name</p>
              </td>
              <td className="py-4 text-lg">11/11/2020</td>
              <td className="py-4 text-lg">2 MB</td>
              <td className="py-4">
                <button className="text-red-500 text-lg">
                  <i className="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td colSpan="5" className="py-2 pl-20 text-gray-500">
                #Tag1 #Tag2
                <button className="ml-4 text-blue-500 bg-[#f2f3f8] rounded-full py-1 px-4 text-sm">+ Add tag</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Upload;
