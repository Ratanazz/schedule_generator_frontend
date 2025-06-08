import React, { useEffect, useRef } from 'react';

const TeacherDetailModal = ({ teacher, onClose, onDelete, onEdit }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!teacher) return null;

  const defaultImageUrl = 'https://i.ibb.co/qY3TgFny/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg';

  const handleDeleteClick = () => {
    onDelete(teacher.id);
  };

  const handleEditClick = () => {
    onEdit(teacher);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div ref={modalRef} className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Teacher Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
          <img
            src={teacher.image_url || defaultImageUrl}
            alt={`${teacher.name}'s profile`}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mb-4 sm:mb-0 sm:mr-6 shadow-md border-2 border-blue-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultImageUrl;
            }}
          />
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-gray-900">{teacher.name}</h3>
            <p className="text-sm text-gray-600">{teacher.email}</p>
            <p className="text-sm text-gray-600">{teacher.phone}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium text-gray-600">Shift:</span>
            <span className="text-gray-800">{teacher.shift || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium text-gray-600">Max Weekly Hours:</span>
            <span className="text-gray-800">{teacher.max_hours || 'N/A'}</span>
          </div>
          <div className="py-2">
            <span className="font-medium text-gray-600">Subjects:</span>
            {teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0 ? (
              <ul className="list-disc list-inside ml-1 mt-1 space-y-1">
                {teacher.subjects.map((s, index) => (
                  <li key={s?.id || index} className="text-gray-800">
                    {s && s.name ? s.name : 'Unnamed Subject'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-800 italic ml-1 mt-1">No subjects assigned.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
           <button
            onClick={handleEditClick}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition duration-150 shadow-sm text-center"
          >
            Edit Teacher
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition duration-150 shadow-sm"
          >
            Delete Teacher
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition duration-150 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
      {/* Global styles for animations. 
          These could also be moved to a global CSS file if you prefer.
          For simplicity here, keeping it with the component.
      */}
      <style jsx global>{`
        @keyframes modalShow {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modalShow {
          animation: modalShow 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

export default TeacherDetailModal;