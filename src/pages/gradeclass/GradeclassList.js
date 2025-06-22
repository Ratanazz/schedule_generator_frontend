import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const GradeclassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => setDeleteConfirm(id);
  const cancelDelete = () => setDeleteConfirm(null);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/gradeclasses/${id}`);
      setClasses(classes.filter(cls => cls.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete class');
    }
  };

  const filteredClasses = classes.filter(cls => {
    const term = searchTerm.toLowerCase();
    return (
      (cls.grade?.name?.toLowerCase() || '').includes(term) ||
      (cls.section?.toLowerCase() || '').includes(term) ||
      (cls.shift?.toLowerCase() || '').includes(term) ||
      (cls.classroom?.toLowerCase() || '').includes(term) ||
      (cls.academic_year?.toLowerCase() || '').includes(term) ||
      String(cls.student_count || '').includes(term)
    );
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredClasses.length, itemsPerPage, totalPages]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = () => {
    const delta = 1;
    const range = [1];
    if (currentPage > delta + 2) range.push('...');
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage < totalPages - (delta + 1)) range.push('...');
    if (totalPages > 1) range.push(totalPages);
    return [...new Set(range)];
  };

  const pageNumbers = getPageNumbers();

  if (loading) {return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-lg text-gray-500 ml-4">Loading Classes...</p></div>)}

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800"> Grade Classes</h1>
        <Link
          to="/classes/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
        >
          ➕ Add New Class
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {/* Controls inside table box */}
        <div className="p-4 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-sm">
            <label>Show</label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded px-2 py-1"
            >
              {[5, 10, 15, 20].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <input
            type="text"
            placeholder="🔍 Search classes..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded px-3 py-1 w-full sm:w-64 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-blue-50 text-blue-800">
              <tr>
                {["Grade Level", "Section", "Shift", "Classroom", "Students", "Academic Year", "Actions"].map(title => (
                  <th key={title} className="px-6 py-3 text-left font-semibold tracking-wide">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedClasses.map(cls => (
                <tr key={cls.id} className="hover:bg-blue-50 transition">
                  <td className="px-6 py-3">Grade {cls.grade?.name || '-'}</td>
                  <td className="px-6 py-3">{cls.section}</td>
                  <td className="px-6 py-3">{cls.shift || '-'}</td>
                  <td className="px-6 py-3">{cls.classroom || 'N/A'}</td>
                  <td className="px-6 py-3">{cls.student_count || 0}</td>
                  <td className="px-6 py-3">{cls.academic_year}</td>
                  <td className="px-6 py-3">
                    {deleteConfirm === cls.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                        >
                          ✅ Confirm
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Link
                          to={`/classes/edit/${cls.id}`}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => confirmDelete(cls.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedClasses.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No classes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t bg-gray-50 text-sm">
          <div className="text-gray-600">
            Showing {filteredClasses.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredClasses.length)} of {filteredClasses.length} entries
          </div>
          <div className="flex space-x-1">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              &laquo;
            </button>
            {pageNumbers.map((num, idx) =>
              num === '...' ? (
                <span key={idx} className="px-2 py-1 text-gray-500">...</span>
              ) : (
                <button
                  key={num}
                  onClick={() => goToPage(num)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === num ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {num}
                </button>
              )
            )}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeclassList;
