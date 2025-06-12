import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link

// ... (keep existing imports and helper functions like daysOrder)

const ScheduleList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  // const [academicYear, setAcademicYear] = useState(''); // No longer needed here for generation
  // const [generateMessage, setGenerateMessage] = useState(''); // Generation messages handled on new page
  const [fetchScheduleError, setFetchScheduleError] = useState('');
  const [viewAcademicYear, setViewAcademicYear] = useState(''); // For viewing specific AY schedule

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const res = await axios.get(`/gradeclasses`); // Ensure this endpoint returns all classes for the user
      setClasses(res.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      // setGenerateMessage('Error fetching class list.'); // This message state is removed
    }
    setLoadingClasses(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchSchedule = async (classIdToFetch) => {
    setLoadingSchedule(true);
    setSchedule(null);
    setSelectedClassData(null);
    setFetchScheduleError('');
    setDeleteError('');
    setDeleteSuccessMessage('');
    setIsDeleting(false);

    try {
      // Allow fetching schedule for a specific academic year if viewAcademicYear is set
      const url = viewAcademicYear 
        ? `/schedules/class/${classIdToFetch}?academic_year=${viewAcademicYear}`
        : `/schedules/class/${classIdToFetch}`;
      const res = await axios.get(url);

      if (res.data && res.data.schedule) {
        setSchedule(res.data.schedule);
        setSelectedClassData({
          id: classIdToFetch,
          name: res.data.class_name,
          shift: res.data.shift,
          classroom: res.data.classroom,
          academic_year: res.data.academic_year, // This will be the AY of the fetched schedule
        });
      } else {
        setFetchScheduleError(res.data?.message || 'Schedule data not found for this class or academic year.');
        setSchedule({});
        setSelectedClassData({
            id: classIdToFetch, name: res.data.class_name || 'N/A',
            shift: res.data.shift || 'N/A', classroom: res.data.classroom || 'N/A',
            academic_year: res.data.academic_year || (viewAcademicYear || 'N/A'), // Use viewAY if specified
        });
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setFetchScheduleError( err.response?.data?.message || 'Failed to fetch schedule.');
      setSchedule(null);
      setSelectedClassData(null);
    }
    setLoadingSchedule(false);
  };

  // generateSchedules function is removed from here

  const handleDeleteSchedule = async () => {
    // ... (keep existing handleDeleteSchedule logic) ...
    if (!selectedClassData || !selectedClassData.id || !selectedClassData.academic_year || selectedClassData.academic_year === 'N/A') {
      setDeleteError("Cannot delete: Class ID or Academic Year is missing or invalid.");
      return;
    }
    setDeleteInProgress(true);
    setDeleteError('');
    setDeleteSuccessMessage('');

    try {
      await axios.delete(`/schedules/class/${selectedClassData.id}/academic-year/${selectedClassData.academic_year}`);
      setDeleteSuccessMessage(`Schedule for ${selectedClassData.name} (Academic Year: ${selectedClassData.academic_year}) deleted successfully.`);
      setSchedule(null); 
      setIsDeleting(false); 
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete schedule.');
    }
    setDeleteInProgress(false);
  };

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-900">📅 View School Schedules</h1>
        <Link 
          to="/schedules/generate-setup"
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition shadow-md text-sm font-medium"
        >
          ⚙️ Generate/Update Schedules
        </Link>
      </div>

      {/* Section to select class and optionally academic year to view */}
      <div className="mb-10 p-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">Select a Class to View</h2>
        <div className="mb-4">
            <label htmlFor="viewAcademicYear" className="block text-sm font-medium text-gray-700 mb-1">
                View Schedule for Academic Year (Optional):
            </label>
            <input
                type="text"
                id="viewAcademicYear"
                placeholder="e.g., 2023-2024 (leave blank for latest)"
                value={viewAcademicYear}
                onChange={(e) => setViewAcademicYear(e.target.value)}
                className="border p-3 rounded-md w-full sm:w-72 focus:ring-blue-500 focus:border-blue-500"
            />
             <p className="text-xs text-gray-500 mt-1">If blank, the system tries to fetch the most relevant schedule.</p>
        </div>
        {loadingClasses && <p className="text-gray-700">Loading classes...</p>}
        {!loadingClasses && classes.length === 0 && (
          <p className="text-gray-700 bg-gray-100 p-4 rounded-lg shadow">No classes found. Add classes in the 'Classes' section.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className={`p-4 rounded-xl shadow-md cursor-pointer transition duration-150 
                ${selectedClassData && selectedClassData.id === cls.id
                  ? 'bg-blue-200 border-2 border-blue-500 ring-2 ring-blue-300'
                  : 'bg-white hover:bg-blue-50 hover:shadow-lg'}`}
              onClick={() => fetchSchedule(cls.id)}
            >
              <h3 className="text-lg font-semibold text-blue-700">
                {cls.grade?.name || 'N/A'} {cls.section || ''}
              </h3>
              <p className="text-sm text-gray-600">Shift: {cls.shift || 'N/A'}</p>
              <p className="text-sm text-gray-600">Known Year: {cls.academic_year || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Display and Delete Logic (remains largely the same) */}
      {loadingSchedule && <p className="text-center text-gray-600 py-4">Loading schedule...</p>}
      
      {selectedClassData && !loadingSchedule && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* ... Header with class name, shift, etc. ... */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3">
              <div>
                <h2 className="text-2xl font-bold text-blue-800">
                  Schedule for {selectedClassData.name}
                </h2>
                <div className="text-sm text-gray-700 mt-1 space-x-2">
                  <span>Shift: {selectedClassData.shift}</span>
                  <span>|</span>
                  <span>Classroom: {selectedClassData.classroom || 'N/A'}</span>
                  <span>|</span>
                  <span>Academic Year: {selectedClassData.academic_year}</span>
                </div>
              </div>
              {selectedClassData.academic_year && selectedClassData.academic_year !== 'N/A' && schedule && Object.keys(schedule).length > 0 && (
                <div className="mt-3 sm:mt-0">
                  {/* ... Delete button logic ... */}
                  {!isDeleting ? (
                  <button
                    onClick={() => {
                      setIsDeleting(true); setDeleteError(''); setDeleteSuccessMessage('');
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete This Schedule
                  </button>
                ) : (
                  <div className="flex flex-col items-end space-y-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-sm text-red-700 font-medium">Confirm deletion?</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={handleDeleteSchedule} disabled={deleteInProgress} className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-md text-xs disabled:opacity-50">
                        {deleteInProgress ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button onClick={() => setIsDeleting(false)} disabled={deleteInProgress} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs disabled:opacity-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
            
            {fetchScheduleError && <p className="text-center text-red-600 py-4 mb-4 bg-red-50 rounded-md">{fetchScheduleError}</p>}
            {deleteError && <p className="text-sm text-red-600 mb-4 p-2 bg-red-50 rounded-md">{deleteError}</p>}
            {deleteSuccessMessage && <p className="text-sm text-green-600 mb-4 p-2 bg-green-50 rounded-md">{deleteSuccessMessage}</p>}

            {schedule && Object.keys(schedule).length === 0 && !fetchScheduleError && !deleteSuccessMessage && (
               <p className="text-center text-gray-500 py-6">No schedule data available for this class and academic year.</p>
            )}

            {schedule && Object.keys(schedule).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ... Schedule grid rendering ... */}
                {daysOrder.filter(day => schedule[day] && schedule[day].length > 0).map((day) => (
                    <div key={day} className="bg-blue-50 p-4 rounded-lg shadow border-blue-200">
                      <h3 className="text-lg font-bold mb-3 text-blue-900 capitalize">{day}</h3>
                      <ul className="space-y-2">
                        {schedule[day].map((slot, i) => (
                          <li key={i} className="p-3 bg-white rounded-md border border-gray-300">
                            <div className="font-medium text-blue-700">{slot.time}</div>
                            <div>{slot.subject}</div>
                            <div className="text-xs text-gray-500">Teacher: {slot.teacher}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ScheduleList;