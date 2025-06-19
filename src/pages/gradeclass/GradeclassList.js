import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GradeclassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // New state variables for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default to 10 items per page

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/gradeclasses');
      setClasses(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch grade classes');
      console.error("Fetch error:", err);
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
      await axios.delete(`/gradeclasses/${id}`);
      setClasses(classes.filter(cls => cls.id !== id));
      setDeleteConfirm(null);
      // If the last item on a page is deleted, and it's not page 1, adjust current page
      if (paginatedClasses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError('Failed to delete class');
      console.error("Delete error:", err);
    }
  };

  // Filtering logic
  const filteredClasses = classes.filter(cls => {
    const gradeName = cls.grade?.name?.toLowerCase() || '';
    const section = cls.section?.toLowerCase() || '';
    const shift = cls.shift?.toLowerCase() || '';
    const classroom = cls.classroom?.toLowerCase() || '';
    const academicYear = cls.academic_year?.toLowerCase() || '';
    const studentCount = String(cls.student_count || '');

    const term = searchTerm.toLowerCase();

    return (
      gradeName.includes(term) ||
      section.includes(term) ||
      shift.includes(term) ||
      classroom.includes(term) ||
      academicYear.includes(term) ||
      studentCount.includes(term)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  
  useEffect(() => {
    // Adjust current page if it becomes invalid after filtering or itemsPerPage change
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage > 1 && totalPages === 0 && filteredClasses.length === 0) {
      // If no pages and no items, but was on a page > 1 (e.g. after search yields nothing)
      setCurrentPage(1);
    } else if (currentPage === 0 && totalPages > 0) { // Should not happen, but a safeguard
        setCurrentPage(1);
    }
  }, [totalPages, currentPage, filteredClasses.length]);


  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  // Event handlers for search and pagination
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    if (totalPages <= 0) return [];

    const pageCount = totalPages;
    const currentPageNum = currentPage;
    const delta = 1; // Number of pages to show around current page (e.g., 1 means < 2 [3] 4 ... >)
                     // User requested < 1 >, so simple prev/current/next is primary.
                     // This generates a slightly more advanced pagination: 1 ... 3 4 5 ... 10
    const range = [];

    // Add first page
    range.push(1);

    // Add ellipsis if needed before current page cluster
    if (currentPageNum > delta + 2) { // e.g. if current is 5, delta 1 -> 5 > 1+2=3, show ... after 1
      range.push('...');
    }

    // Add pages around current page
    for (
      let i = Math.max(2, currentPageNum - delta);
      i <= Math.min(pageCount - 1, currentPageNum + delta);
      i++
    ) {
      range.push(i);
    }

    // Add ellipsis if needed after current page cluster
    if (currentPageNum < pageCount - (delta + 1)) { // e.g. if current is 5, total 10, delta 1 -> 5 < 10-(1+1)=8, show ... before last
      range.push('...');
    }

    // Add last page (if not already included and totalPages > 1)
    if (pageCount > 1 && !range.includes(pageCount)) {
      range.push(pageCount);
    }
    
    // Remove duplicates which might occur for small totalPages
    return [...new Set(range)];
  };
  
  const pageNumbersToDisplay = getPageNumbers();


  if (loading) {
    return <div className="text-center py-8">Loading grade classes...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grade Classes (7-12)</h1>
        <Link
          to="/classes/create"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Add New Class
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Controls for items per page and search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center">
          <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-700">Show:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 rounded p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
          <span className="ml-2 text-sm text-gray-700">entries</span>
        </div>
        <div>
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
            style={{ minWidth: '250px' }}
          />
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            {searchTerm ? 'No classes match your search criteria.' : (classes.length === 0 ? 'No classes found. Add your first class to get started.' : 'No classes available with current filters.')}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Level</th>
                  <th className="py-3 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="py-3 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="py-3 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classroom</th>
                  <th className="py-3 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># of Students</th>
                  <th className="py-3 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                  <th className="py-3 px-4 border text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border whitespace-nowrap">Grade {cls.grade?.name || '-'}</td>
                    <td className="py-2 px-4 border whitespace-nowrap">{cls.section}</td>
                    <td className="py-2 px-4 border whitespace-nowrap">{cls.shift || '-'}</td>
                    <td className="py-2 px-4 border whitespace-nowrap">{cls.classroom || 'N/A'}</td>
                    <td className="py-2 px-4 border whitespace-nowrap">{cls.student_count || 0}</td>
                    <td className="py-2 px-4 border whitespace-nowrap">{cls.academic_year}</td>
                    <td className="py-2 px-4 border text-center whitespace-nowrap">
                      {deleteConfirm === cls.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleDelete(cls.id)}
                            className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            to={`/classes/edit/${cls.id}`}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => confirmDelete(cls.id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination info and controls */}
          {totalPages > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing {filteredClasses.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredClasses.length)} of {filteredClasses.length} entries
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  aria-label="Previous Page"
                >
                  
                </button>
                
                {pageNumbersToDisplay.map((page, index) =>
                  typeof page === 'number' ? (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                        currentPage === page 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-500">
                      {page} {/* This is '...' */}
                    </span>
                  )
                )}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  aria-label="Next Page"
                >
                  
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GradeclassList;