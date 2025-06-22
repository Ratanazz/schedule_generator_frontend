import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubjectList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubjectDetails, setSelectedSubjectDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/subjects'); 
      setSubjects(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch subjects. Please try again later.');
      console.error("Fetch subjects error:", err);
      
      if (err.response) {
        console.error("Error data:", err.response.data);
        console.error("Error status:", err.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDelete = async (id) => {
    try {
      // *** REPLACE WITH YOUR ACTUAL DELETE SUBJECT API ENDPOINT ***
      await axios.delete(`/subjects/${id}`); 
      const updatedSubjects = subjects.filter((subject) => subject.id !== id);
      setSubjects(updatedSubjects);

      if (selectedSubjectDetails && selectedSubjectDetails.id === id) {
        closeModal();
      }
      setDeleteConfirm(null);

      const newTotalItems = updatedSubjects.length;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);

      if (newTotalItems === 0) {
        setCurrentPage(1);
      } else if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      setError('Failed to delete subject. Please try again.');
      console.error("Delete subject error:", err);
    }
  };

  const handleRowClick = async (subject) => {
    if (deleteConfirm === subject.id) {
      return;
    }

    setSelectedSubjectDetails(null); // Clear previous details
    setModalError('');
    setIsModalOpen(true);
    setModalLoading(true);

    try {
     
      const response = await axios.get(`/subjects/${subject.id}/teachers`);
      
      let fetchedTeachers = response.data;

      // Ensure fetchedTeachers is an array
      if (!Array.isArray(fetchedTeachers)) {
        console.warn("API did not return an array of teachers for subject:", subject.name, "Response:", fetchedTeachers);
        fetchedTeachers = []; 
      }

      

      setSelectedSubjectDetails({ ...subject, teachers: fetchedTeachers });

    } catch (err) {
      console.error(`Error fetching teachers for subject ${subject.name} (ID: ${subject.id}):`, err);
      setModalError(`Failed to fetch teachers for ${subject.name}. Please try again.`);
      
      setSelectedSubjectDetails({ ...subject, teachers: [] }); 
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubjectDetails(null);
    setModalLoading(false);
    setModalError('');
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubjects = subjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(subjects.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-600 text-lg font-semibold animate-pulse ml-4">Loading subjects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">SUBJECTS</h1>
        <Link
          to="/subjects/create" 
          className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center self-start sm:self-auto"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Add New Subject
        </Link>
        
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow">
          {error}
        </div>
      )}

      {subjects.length === 0 && !loading ? (
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No subjects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first subject.
          </p>
          <Link
            to="/subjects/create" // Adjust if your create route is different
            className="mt-6 inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm font-medium"
          >
            Add Subject
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center">
            <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-700">Show</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
            <span className="ml-2 text-sm text-gray-700">entries</span>
            <Link
                to="/subjects/details" 
                className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center self-start sm:self-auto"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Subjects Details
        </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="hover:bg-gray-50 transition duration-150 ease-in-out cursor-pointer"
                    onClick={() => handleRowClick(subject)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {subject.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {subject.default_hours || 0} hr/week
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={subject.description}>
                      {subject.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/subjects/edit/${subject.id}`} // Adjust if your edit route is different
                          className="text-indigo-600 hover:text-indigo-800 transition duration-150 flex items-center text-xs"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          Edit
                        </Link>
                        {deleteConfirm === subject.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(subject.id)}
                              className="text-green-600 hover:text-green-800 transition duration-150 flex items-center text-xs px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Confirm
                            </button>
                            <button
                              onClick={cancelDelete}
                              className="text-gray-600 hover:text-gray-800 transition duration-150 flex items-center text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => confirmDelete(subject.id)}
                            className="text-red-600 hover:text-red-800 transition duration-150 flex items-center text-xs"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 4v12m4-12v12"></path></svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subjects.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700">
              <div className="mb-2 sm:mb-0">
                Showing {subjects.length > 0 ? Math.min(indexOfFirstItem + 1, subjects.length) : 0} to {Math.min(indexOfLastItem, subjects.length)} of {subjects.length} entries
              </div>
              {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center"
                    aria-label="Previous page"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  </button>
                  <span className="px-4 py-1.5 border border-blue-500 bg-blue-100 text-blue-600 rounded-md font-semibold">
                    {currentPage}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center"
                    aria-label="Next page"
                  >
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal for Showing Teachers */}
      {isModalOpen && selectedSubjectDetails && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50 transition-opacity duration-300 ease-in-out"
          onClick={closeModal}
        >
          <div 
            className="relative p-6 bg-white w-full max-w-lg mx-auto rounded-lg shadow-xl transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h2 id="modal-title" className="text-2xl font-semibold mb-2 text-gray-800">
              Teachers for: <span className="text-blue-600">{selectedSubjectDetails.name}</span>
            </h2>
            <p className="text-sm text-gray-500 mb-6">Subject Code: {selectedSubjectDetails.code}</p>

            {modalLoading && (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading teachers...</p>
              </div>
            )}

            {modalError && !modalLoading && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-4 rounded">
                <p className="font-bold">Error</p>
                <p>{modalError}</p>
              </div>
            )}

            {!modalLoading && !modalError && (
              <>
                {selectedSubjectDetails.teachers && selectedSubjectDetails.teachers.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <ul className="space-y-3">
                      {selectedSubjectDetails.teachers.map(teacher => (
                        <li key={teacher.id} className="p-3 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-200 transition-colors">
                          <span className="text-gray-800 font-medium">{teacher.name}</span>
                          {/* You can add more teacher details here if available, e.g., teacher.email, teacher.department */}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-md">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.007-7.007A3 3 0 0118 8.006a3 3 0 012.993 2.993m-9.052 0a3.001 3.001 0 001.05 2.08M12 21a9.004 9.004 0 008.616-11.616A9.004 9.004 0 0012 3a9.004 9.004 0 00-8.616 11.616A9.004 9.004 0 0012 21zm-2.08-5.052A3 3 0 016 13.006a3 3 0 012.993-2.993" />
                    </svg>
                    <p className="mt-2 text-md text-gray-600">No teachers are currently assigned to this subject.</p>
                  </div>
                )}
              </>
            )}

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes modalFadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalFadeInScale {
          animation: modalFadeInScale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SubjectList;