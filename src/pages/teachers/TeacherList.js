import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios'; // This will use the defaults (baseURL, Authorization header) set by AuthContext.js
import TeacherFormModal from './TeacherFormModal'; // Adjust path if necessary
import TeacherDetailModal from './TeacherDetailModal'; // Adjust path if necessary
// If you need access to currentUser for display or specific logic:
// import { useAuth } from './path/to/your/AuthContext'; // Ensure this path is correct

const TeacherList = () => {
  // const { currentUser, logout: authLogout } = useAuth();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // For fetch errors

  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState(null);

  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [actionFeedback, setActionFeedback] = useState({ message: '', type: '', data: null });

  const defaultImageUrl = 'https://i.ibb.co/qY3TgFny/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg';

  const fetchTeachers = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.get('/teachers'); // Relative path
      console.log("API Response (/teachers from TeacherList):", response.data);
      setTeachers(Array.isArray(response.data) ? response.data : (response.data.data || []));
    } catch (err) {
      console.error("API Error fetching teachers (TeacherList):", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Your session may have expired. Please log in again.");
          // if (authLogout) authLogout();
        } else {
          setError(`Failed to fetch teachers: ${err.response.data?.message || err.message} (Status: ${err.response.status})`);
        }
      } else if (err.request) {
        setError('Failed to fetch teachers. No response from server. Check network or API.');
      } else {
        setError(`Failed to fetch teachers: ${err.message}`);
      }
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDeleteProfile = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you sure you want to delete the PROFILE for ${teacherName}? This does not delete their login account. This action cannot be undone.`)) {
      return;
    }
    setActionFeedback({ message: '', type: '', data: null });
    try {
      await axios.delete(`/teachers/${teacherId}`); // Relative path
      setActionFeedback({ message: `Teacher profile for ${teacherName} deleted successfully.`, type: 'success' });
      fetchTeachers();
      if (selectedTeacherDetail && selectedTeacherDetail.id === teacherId) {
        closeDetailModal();
      }
    } catch (err) {
      console.error("Delete Profile Error:", err);
      const errorMessage = err.response?.data?.message || `Failed to delete teacher profile.`;
      setActionFeedback({ message: errorMessage, type: 'error' });
    }
  };

  const handleCreateAccount = async (teacherId, teacherName) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher || !teacher.email) {
      setActionFeedback({ message: `Cannot create account: Teacher ${teacherName} does not have an email address. Please update their profile.`, type: 'error'});
      return;
    }
    if (!window.confirm(`Create a user login account for ${teacherName}? Email: ${teacher.email}. A temporary password will be generated.`)) {
      return;
    }
    setActionFeedback({ message: '', type: '', data: null });
    try {
      const response = await axios.post(`/teachers/${teacherId}/create-account`, {}); // Relative path
      setActionFeedback({
        message: `${response.data.message}. Login Email: ${response.data.email}.`,
        type: 'success',
        data: { temporaryPassword: response.data.temporary_password }
      });
      fetchTeachers();
    } catch (err) {
      console.error("Create Account Error:", err);
      const errorMessage = err.response?.data?.message || 'Failed to create teacher account.';
      setActionFeedback({ message: errorMessage, type: 'error' });
    }
  };

  const handleDeleteAccount = async (teacherId, accountUserId, teacherName) => {
    if (!window.confirm(`CRITICAL ACTION: Delete the USER LOGIN ACCOUNT for ${teacherName} (User ID: ${accountUserId})? This removes their ability to log in. The teacher profile will REMAIN. Are you absolutely sure?`)) {
      return;
    }
    setActionFeedback({ message: '', type: '', data: null });
    try {
      const response = await axios.delete(`/teachers/${teacherId}/delete-account`); // Relative path
      setActionFeedback({ message: response.data.message, type: 'success' });
      fetchTeachers();
    } catch (err) {
      console.error("Delete Account Error:", err);
      const errorMessage = err.response?.data?.message || 'Failed to delete teacher user account.';
      setActionFeedback({ message: errorMessage, type: 'error' });
    }
  };


  const filteredTeachers = useMemo(() => {
    let tempTeachers = Array.isArray(teachers) ? teachers : [];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempTeachers = tempTeachers.filter(teacher =>
        (teacher.name && teacher.name.toLowerCase().includes(lowerSearchTerm)) ||
        (teacher.phone && teacher.phone.toLowerCase().includes(lowerSearchTerm)) ||
        (teacher.email && teacher.email.toLowerCase().includes(lowerSearchTerm))
      );
    }
    if (selectedSubjectFilter) {
      tempTeachers = tempTeachers.filter(teacher =>
        teacher.subjects &&
        Array.isArray(teacher.subjects) &&
        teacher.subjects.some(subject => subject && subject.name === selectedSubjectFilter)
      );
    }
    return tempTeachers;
  }, [teachers, searchTerm, selectedSubjectFilter]);

  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeachers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeachers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredTeachers.length / itemsPerPage)), [filteredTeachers, itemsPerPage]);
  const totalTeachers = useMemo(() => (Array.isArray(teachers) ? teachers.length : 0), [teachers]);

  const shiftCounts = useMemo(() => {
    if (!Array.isArray(teachers) || teachers.length === 0) return {};
    return teachers.reduce((acc, teacher) => {
      const shift = teacher.shift || 'Unassigned';
      acc[shift] = (acc[shift] || 0) + 1;
      return acc;
    }, {});
  }, [teachers]);

  const subjectCounts = useMemo(() => {
    if (!Array.isArray(teachers) || teachers.length === 0) return {};
    const counts = {};
    teachers.forEach(teacher => {
      if (teacher.subjects && Array.isArray(teacher.subjects)) {
        teacher.subjects.forEach(subject => {
          if (subject && subject.name) {
            counts[subject.name] = (counts[subject.name] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((obj, [key, value]) => { obj[key] = value; return obj; }, {});
  }, [teachers]);

  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setCurrentPage(1); };
  const handleItemsPerPageChange = (event) => { setItemsPerPage(Number(event.target.value)); setCurrentPage(1); };
  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };
  const handleSubjectFilterClick = (subjectName) => { setSelectedSubjectFilter(prev => (prev === subjectName ? null : subjectName)); setCurrentPage(1); };
  const handleRowClick = (teacher) => { setSelectedTeacherDetail(teacher); setIsDetailModalOpen(true); setActionFeedback({ message: '', type: '', data: null });};
  const closeDetailModal = () => { setIsDetailModalOpen(false); setSelectedTeacherDetail(null); };
  const openAddTeacherModal = () => { setEditingTeacher(null); setIsFormModalOpen(true); setActionFeedback({ message: '', type: '', data: null }); };
  const openEditTeacherModal = (teacher) => { setEditingTeacher(teacher); setIsFormModalOpen(true); if(isDetailModalOpen) setIsDetailModalOpen(false); setActionFeedback({ message: '', type: '', data: null });};
  const closeFormModal = () => { setIsFormModalOpen(false); setEditingTeacher(null); };

  const handleFormSaveSuccess = () => {
    fetchTeachers();
    closeFormModal();
    setActionFeedback({ message: editingTeacher ? 'Teacher profile updated successfully.' : 'New teacher profile created successfully.', type: 'success'});
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    else if (totalPages === 0 && filteredTeachers.length === 0 && currentPage !== 1) setCurrentPage(1);
  }, [currentPage, totalPages, filteredTeachers.length]);


  if (loading && totalTeachers === 0 && !error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-600 text-lg font-semibold animate-pulse ml-4">Loading Teachers...</div>
      </div>
    );
  }

  const firstEntryIndex = filteredTeachers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const lastEntryIndex = Math.min(currentPage * itemsPerPage, filteredTeachers.length);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto"> {/* max-w-7xl was from your original old design */}
        {actionFeedback.message && (
          <div
            className={`p-4 mb-6 rounded-md shadow-lg transition-all duration-300 ${
              actionFeedback.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' :
              actionFeedback.type === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' :
              'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
            }`}
            role="alert"
          >
            <div className="flex">
              <div className="py-1">
                {actionFeedback.type === 'success' && <svg className="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM6.7 9.29L9 11.6l4.3-4.3 1.4 1.42L9 14.4l-3.7-3.7 1.4-1.42z"/></svg>}
                {actionFeedback.type === 'error' && <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.828-1.415-1.415L10 8.586 7.172 5.757 5.757 7.172 8.586 10l-2.829 2.828 1.415 1.415L10 11.414l2.828 2.829 1.415-1.415L11.414 10z"/></svg>}
                {actionFeedback.type === 'info' && <svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2V9H9zm2-4a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/></svg>}
              </div>
              <div>
                <p className="font-bold">
                  {actionFeedback.type === 'success' ? 'Success' : actionFeedback.type === 'error' ? 'Error' : 'Information'}
                </p>
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: actionFeedback.message.replace(/\n/g, '<br />') }} />
                {actionFeedback.type === 'success' && actionFeedback.data?.temporaryPassword && (
                  <p className="mt-2 text-xs">
                    <strong>Important:</strong> Temporary Password:
                    <span className="font-mono bg-gray-200 text-black px-1.5 py-0.5 rounded ml-1">{actionFeedback.data.temporaryPassword}</span>
                    <br />Please communicate this securely. The user should change it upon first login.
                  </p>
                )}
              </div>
              <button
                onClick={() => setActionFeedback({ message: '', type: '', data: null })}
                className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex h-8 w-8 self-start"
                aria-label="Dismiss"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </button>
            </div>
          </div>
        )}

        {!loading && (totalTeachers > 0 || (!error && totalTeachers === 0)) && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <p className="text-4xl font-bold text-blue-600">{totalTeachers}</p>
              <p className="mt-1 text-sm font-medium text-gray-500 uppercase tracking-wider">Total Teachers</p>
              {Object.entries(shiftCounts).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">By Shift</h3>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {Object.entries(shiftCounts).map(([shift, count]) => (
                      <div key={shift} className="flex items-center justify-between text-sm">
                        <p className="text-gray-700">{shift}</p>
                        <p className="font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Filter by Subject</h3>
                {selectedSubjectFilter && (<button onClick={() => handleSubjectFilterClick(null)} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear Filter</button>)}
              </div>
              {Object.entries(subjectCounts).length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {Object.entries(subjectCounts).map(([subject, count]) => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectFilterClick(subject)}
                      title={`Filter by ${subject} (${count} teachers)`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${selectedSubjectFilter === subject ? 'bg-purple-600 text-white shadow-md ring-purple-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 ring-gray-300'}`}
                    >
                      {subject} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${selectedSubjectFilter === subject ? 'bg-purple-400 text-purple-50' : 'bg-gray-300 text-gray-600'}`}>{count}</span>
                    </button>
                  ))}
                </div>
              ) : (<p className="text-gray-600 text-sm italic">No subject data available to filter.</p>)}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Teacher Management</h1>
          <button onClick={openAddTeacherModal} className="bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            Add New Teacher Profile
          </button>
        </div>

        {error && !actionFeedback.message && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow">
            <p className="font-bold">Error Fetching Teacher Data</p>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 border-b border-gray-200">
            <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-600">Show</label>
                <select id="itemsPerPage" value={itemsPerPage} onChange={handleItemsPerPageChange} className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                    {[5, 10, 15, 20, 50, 100].map(num => <option key={num} value={num}>{num}</option>)}
                </select>
                <span className="text-sm text-gray-600">entries</span>
            </div>
            <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                </div>
                <input type="text" placeholder="Search (name, email, phone)..." value={searchTerm} onChange={handleSearchChange} className="pl-10 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full sm:w-64" />
            </div>
          </div>

          {/* Old Table Design Reinstated */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grades</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(loading && totalTeachers === 0 && !error ) && (
                  <tr><td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">Loading teachers data...</td></tr>
                )}
                {!loading && paginatedTeachers.length === 0 && (
                   <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">
                      {error
                        ? `Error: ${error}`
                        : (searchTerm || selectedSubjectFilter)
                          ? 'No teachers match your search or filter criteria.'
                          : 'No teachers found. Try adding some!'}
                    </td>
                  </tr>
                )}
                {!loading && paginatedTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-100 transition duration-150 cursor-pointer"
                    onClick={() => handleRowClick(teacher)} // Row click opens detail modal
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center space-x-3">
                        <img
                          src={teacher.image_url || defaultImageUrl}
                          alt={teacher.name ? `${teacher.name}'s profile` : 'Teacher'}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = defaultImageUrl; }}
                        />
                        <span>{teacher.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {teacher.grades?.map(g => g.name).join(', ') || <span className="text-gray-400 italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.shift || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{teacher.max_hours || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {teacher.subjects?.map(s => s.name).filter(Boolean).join(', ') || <span className="text-gray-400 italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1 items-start sm:items-center sm:flex-row sm:space-y-0 sm:space-x-2">
                        {/* <button
                          onClick={(e) => { e.stopPropagation(); openEditTeacherModal(teacher); }}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline transition duration-150 py-1 px-0.5 text-xs"
                          title="Edit teacher profile"
                        >
                          Edit Profile
                        </button> */}
                        {!teacher.account_user_id ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCreateAccount(teacher.id, teacher.name); }}
                                className={`text-green-600 hover:text-green-800 hover:underline transition duration-150 py-1 px-0.5 text-xs ${!teacher.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={!teacher.email ? "Teacher email required" : "Create login account"}
                                disabled={!teacher.email}
                            >
                                Create Account
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteAccount(teacher.id, teacher.account_user_id, teacher.name); }}
                                className="text-red-600 hover:text-red-800 hover:underline transition duration-150 py-1 px-0.5 text-xs"
                                title="Delete login account"
                            >
                                Delete Account
                            </button>
                        )}
                        {/* Delete Profile button could also be placed here or inside TeacherDetailModal */}
                        {/* For this old design, let's assume TeacherDetailModal handles the "Delete Profile" more directly */}
                      </div>
                       {!teacher.email && !teacher.account_user_id && (
                            <p className="text-xs text-orange-500 italic mt-0.5">Email needed for login</p>
                        )}
                         {teacher.account_user_id && (
                            <p className="text-xs text-green-600 italic mt-0.5">Login Active</p>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length > 0 && (
             <div className="p-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Showing {firstEntryIndex} to {lastEntryIndex} of {filteredTeachers.length} entries
                    {searchTerm && <span className="ml-1 font-semibold text-gray-500">(searched)</span>}
                    {selectedSubjectFilter && <span className="ml-1 font-semibold text-gray-500">(filtered by "{selectedSubjectFilter}")</span>}
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg></button>
                  <span className="px-3 py-1 border border-blue-500 bg-blue-500 text-white rounded-md text-sm font-semibold shadow-sm">{currentPage}</span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg></button>
                </div>
            </div>
          )}
        </div>
      </div>

      {isDetailModalOpen && selectedTeacherDetail && (
        <TeacherDetailModal
          teacher={selectedTeacherDetail}
          onClose={closeDetailModal}
          onDelete={(id, name) => handleDeleteProfile(id, name)} // TeacherDetailModal should probably handle profile deletion
          onEdit={openEditTeacherModal}
        />
      )}

      {isFormModalOpen && (
        <TeacherFormModal
          isOpen={isFormModalOpen}
          onClose={closeFormModal}
          teacherToEdit={editingTeacher}
          onSaveSuccess={handleFormSaveSuccess}
        />
      )}
    </div>
  );
};

export default TeacherList;