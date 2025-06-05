import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true); // Ensure loading is true at the start of fetch
      setError(null);   // Clear previous errors
      try {
        const response = await axios.get('/teachers'); // Your original API call
        setTeachers(response.data);
      } catch (err) {
        console.error("API Error:", err); // Log the actual error for debugging
        setError('Failed to fetch teachers. Please check the API endpoint or network connection.');
        setTeachers([]); // Set to empty array on error to prevent issues with map/reduce
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []); // Empty dependency array means this runs once on mount

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await axios.delete(`/teachers/${id}`); // Your original API call
        setTeachers(teachers.filter((teacher) => teacher.id !== id));
      } catch (err) {
        setError('Failed to delete teacher');
      }
    }
  };

  // Calculate summary data - this will use the 'teachers' state populated by your backend
  const totalTeachers = useMemo(() => teachers.length, [teachers]);

  const shiftCounts = useMemo(() => {
    if (!teachers || teachers.length === 0) return {};
    return teachers.reduce((acc, teacher) => {
      const shift = teacher.shift || 'Unassigned'; // Handle cases where shift might be null/undefined
      acc[shift] = (acc[shift] || 0) + 1;
      return acc;
    }, {});
  }, [teachers]);

  const subjectCounts = useMemo(() => {
    if (!teachers || teachers.length === 0) return {};
    const counts = {};
    teachers.forEach(teacher => {
      // Ensure subjects is an array and not empty before trying to map
      if (teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
        teacher.subjects.forEach(subject => {
          // Ensure subject itself and subject.name are valid
          const subjectName = subject && subject.name ? subject.name : 'Unnamed Subject';
          counts[subjectName] = (counts[subjectName] || 0) + 1;
        });
      } else {
        // Optionally, count teachers with no subjects if that's relevant
        // counts['No Subjects Assigned'] = (counts['No Subjects Assigned'] || 0) + 1;
      }
    });
    return counts;
  }, [teachers]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-gray-600 text-lg font-semibold animate-pulse">Loading Teachers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Summary Section */}
        {/* Only show summary if not loading AND there is data OR no error occurred that prevented data loading */}
        {!loading && (teachers.length > 0 || !error) && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"> {/* Adjusted grid for responsiveness */}
            {/* Card 1: Total Teachers */}
            <div className="bg-white p-5 rounded-xl shadow-lg">
              <p className="text-4xl font-bold text-blue-600">{totalTeachers}</p>
              <p className="mt-1 text-sm font-medium text-gray-500 uppercase tracking-wider">Total Teachers</p>
            </div>

            {/* Card 2: Teachers by Shift */}
            <div className="bg-white p-5 rounded-xl shadow-lg">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Teachers by Shift</p>
              {Object.entries(shiftCounts).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto"> {/* Added max-height and scroll */}
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

            {/* Card 3: Teachers by Subject */}
            <div className="bg-white p-5 rounded-xl shadow-lg md:col-span-2 lg:col-span-1"> {/* Adjust span for better layout */}
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Teachers by Subject</p>
              {Object.entries(subjectCounts).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto"> {/* Added max-height and scroll */}
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

        {/* Teachers List Title and Add Button */}
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

        {/* Teachers Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
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
                {!loading && teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center space-x-3">
                          <img
                            // --- THE FIX IS HERE ---
                            src={teacher.image_url ? teacher.image_url : 'https://via.placeholder.com/40'}
                            alt={teacher.name}
                            className="w-10 h-10 rounded-full object-cover"
                            // Optional: Add an error handler for broken images
                            onError={(e) => {
                              e.target.onerror = null; // Prevents looping if placeholder also fails
                              e.target.src = 'https://via.placeholder.com/40'; // Fallback image
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
                          className="text-indigo-600 hover:text-indigo-800 hover:underline mr-4 transition duration-150"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(teacher.id)}
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
                      {loading ? 'Loading...' : (error ? 'Error loading data.' : 'No teachers found. Try adding some!')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherList;