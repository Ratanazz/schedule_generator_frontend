// src/components/ConfirmationModal.jsx (or ./ConfirmationModal.jsx if in the same folder as TeacherList)
import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children, // For the message/body content
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700 text-white", // Default to destructive action style
  isConfirmDisabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-[100]" // Ensure high z-index
      onClick={onClose} // Optional: close on overlay click
    >
      <div
        className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <div className="mt-3 text-center">
          <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="mt-2 px-2 py-3 text-sm text-gray-600">
            {children}
          </div>
          <div className="flex items-center justify-center px-4 py-3 space-x-4 mt-4">
            <button
              id="cancel-btn"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors duration-150 font-medium"
            >
              {cancelButtonText}
            </button>
            <button
              id="confirm-btn"
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-150 font-medium ${confirmButtonClass} ${isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;