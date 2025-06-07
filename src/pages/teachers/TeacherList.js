import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Modal Component (can be in the same file or a separate one)
const TeacherDetailModal = ({ teacher, onClose }) => {
  if (!teacher) return null;

  const defaultImageUrl = 'https://i.ibb.co/qY3TgFny/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg'; // Default placeholder

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow">
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
                  <li key={index} className="text-gray-800">
                    {s && s.name ? s.name : 'Unnamed Subject'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-800 italic ml-1 mt-1">No subjects assigned.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
           <Link
            to={`/teachers/edit/${teacher.id}`}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition duration-150 shadow-sm"
            onClick={onClose} // Close modal when navigating
          >
            Edit Teacher
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition duration-150 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
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


const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultImageUrl = 'https://i.ibb.co/qY3TgFny/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg';


  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/teachers'); // *** Reverted to use your API endpoint ***
        setTeachers(response.data);
      } catch (err) {
        console.error("API Error:", err);
        setError('Failed to fetch teachers. Please check the API endpoint or network connection.');
        setTeachers([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []); // Empty dependency array means this runs once on mount

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await axios.delete(`/teachers/${id}`); // Your API for delete
        setTeachers(teachers.filter((teacher) => teacher.id !== id));
        if (selectedTeacher && selectedTeacher.id === id) {
          closeModal();
        }
        // Adjust current page if the last item on the page was deleted
        const newTotalPages = Math.max(1, Math.ceil((filteredTeachers.length - 1) / itemsPerPage));
        if (currentPage > newTotalPages) {
            setCurrentPage(newTotalPages);
        }
      } catch (err) {
        setError('Failed to delete teacher');
      }
    }
  };

  const filteredTeachers = useMemo(() => {
    if (!searchTerm) {
      return teachers;
    }
    return teachers.filter(teacher =>
      (teacher.name && teacher.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (teacher.phone && teacher.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teachers, searchTerm]);

  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeachers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeachers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTeachers.length / itemsPerPage));
  }, [filteredTeachers, itemsPerPage]);


  const totalTeachers = useMemo(() => teachers.length, [teachers]);
  const shiftCounts = useMemo(() => {
    if (!teachers || teachers.length === 0) return {};
    return teachers.reduce((acc, teacher) => {
      const shift = teacher.shift || 'Unassigned';
      acc[shift] = (acc[shift] || 0) + 1;
      return acc;
    }, {});
  }, [teachers]);

  const subjectCounts = useMemo(() => {
    if (!teachers || teachers.length === 0) return {};
    const counts = {};
    teachers.forEach(teacher => {
      if (teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
        teacher.subjects.forEach(subject => {
          const subjectName = subject && subject.name ? subject.name : 'Unnamed Subject';
          counts[subjectName] = (counts[subjectName] || 0) + 1;
        });
      }
    });
    return counts;
  }, [teachers]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowClick = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) { // Ensure totalPages is positive
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && filteredTeachers.length === 0) { // If no results, reset to page 1
        setCurrentPage(1);
    }
  }, [currentPage, totalPages, filteredTeachers.length]);


  if (loading && teachers.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-gray-600 text-lg font-semibold animate-pulse">Loading Teachers...</div>
      </div>
    );
  }

  const firstEntryIndex = filteredTeachers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const lastEntryIndex = Math.min(currentPage * itemsPerPage, filteredTeachers.length);


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {!loading && (teachers.length > 0 || !error) && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl shadow-lg">
              <p className="text-4xl font-bold text-blue-600">{totalTeachers}</p>
              <p className="mt-1 text-sm font-medium text-gray-500 uppercase tracking-wider">Total Teachers</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-lg">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Teachers by Shift</p>
              {Object.entries(shiftCounts).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(shiftCounts).map(([shift, count]) => (
                  <div key={shift} className="flex items-center justify-between">
                    <p className="text-gray-700 text-base">{shift}</p>
                    <p className="text-2xl font-semibold text-green-600">{count}</p>
                  </div>
                ))}
                </div>
              ) : (
                <p className="text-gray-700 text-base">No shift data available.</p>
              )}
            </div>
            <div className="bg-white p-5 rounded-xl shadow-lg md:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Teachers by Subject</p>
              {Object.entries(subjectCounts).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(subjectCounts).map(([subject, count]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <p className="text-gray-700 text-base truncate pr-2" title={subject}>{subject}</p>
                    <p className="text-2xl font-semibold text-purple-600">{count}</p>
                  </div>
                ))}
                </div>
              ) : (
                <p className="text-gray-700 text-base">No subject data available.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Teacher Management</h1>
          <Link
            to="/teachers/create"
            className="bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm font-medium shadow-md hover:shadow-lg"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            Add New Teacher
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600">Show</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                {[5, 10, 15, 20].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && paginatedTeachers.length === 0 && !error ? ( // Show loading only if not an error state
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">
                      Loading teachers data...
                    </td>
                  </tr>
                ) : !loading && paginatedTeachers.length > 0 ? (
                  paginatedTeachers.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="hover:bg-gray-100 transition duration-150 cursor-pointer"
                      onClick={() => handleRowClick(teacher)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center space-x-3">
                          <img
                            src={teacher.image_url || defaultImageUrl}
                            alt={`${teacher.name}'s profile`}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = defaultImageUrl;
                            }}
                          />
                          <span>{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.shift || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{teacher.max_hours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0
                          ? teacher.subjects.map((s) => s && s.name).filter(Boolean).join(', ')
                          : <span className="text-gray-400 italic">None</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/teachers/edit/${teacher.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline mr-4 transition duration-150"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(teacher.id);
                          }}
                          className="text-red-600 hover:text-red-800 hover:underline transition duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">
                      {error ? 'Error: ' + error : (searchTerm && filteredTeachers.length === 0 ? 'No teachers match your search.' : 'No teachers found. Try adding some!')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length > 0 && (
             <div className="p-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                Showing {firstEntryIndex} to {lastEntryIndex} of {filteredTeachers.length} entries
                </div>
                <div className="flex items-center space-x-1">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                >
                    
                </button>
                <span className="px-3 py-1 border border-blue-500 bg-blue-500 text-white rounded-md text-sm font-semibold shadow-sm">
                    {currentPage}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                >
                    
                </button>
                </div>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && <TeacherDetailModal teacher={selectedTeacher} onClose={closeModal} />}
    </div>
  );
};

export default TeacherList;