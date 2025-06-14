import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// FIX 1: Change academic year options to single years
const academicYearOptions = Array.from({ length: 7 }, (_, i) => `${2024 + i}`);
const shiftOptions = ["Morning", "Afternoon"];

const ScheduleList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [fetchClassesError, setFetchClassesError] = useState(''); // Specific error for fetching classes
  const [fetchScheduleError, setFetchScheduleError] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Filters State
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [grades, setGrades] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const fetchGradesForFilter = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const res = await axios.get('/grades'); // Ensure this endpoint is correct
      setGrades(res.data || []);
    } catch (err) {
      console.error('Error fetching grades for filter:', err);
      // Optionally set an error state for grades fetching
    }
    setLoadingFilters(false);
  }, []);

  useEffect(() => {
    fetchGradesForFilter();
  }, [fetchGradesForFilter]);

  // FIX 2: Correct fetchClasses to make an API call
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    setClasses([]);
    setSelectedClassData(null);
    setSchedule(null);
    setFetchClassesError(''); // Clear previous class fetching errors
    setFetchScheduleError('');
    setDeleteError('');
    setDeleteSuccessMessage('');

    const queryParams = {};
    if (filterAcademicYear) queryParams.academic_year = filterAcademicYear;
    if (filterGradeId) queryParams.grade_id = filterGradeId;
    if (filterShift) queryParams.shift = filterShift;

    try {
      // Actually make the API call to fetch classes with filters
      const response = await axios.get('/gradeclasses', { params: queryParams }); // Ensure '/classes' is your correct endpoint
      setClasses(response.data || []);
      if (response.data && response.data.length === 0) {
        setFetchClassesError('No classes found matching your criteria.');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setFetchClassesError(err.response?.data?.message || 'Failed to fetch classes.');
      setClasses([]); // Ensure classes list is empty on error
    } finally {
      setLoadingClasses(false);
    }
  }, [filterAcademicYear, filterGradeId, filterShift]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchSchedule = async (classIdToFetch, targetAcademicYear) => {
    setLoadingSchedule(true);
    setSchedule(null);
    setFetchScheduleError('');
    setDeleteError('');
    setDeleteSuccessMessage('');
    setIsDeleting(false);

    // Find class info from the current 'classes' state
    // Ensure academic_year matching is also considered if classes can have same ID but different AY
    const classInfo = classes.find(c => c.id === classIdToFetch && c.academic_year === targetAcademicYear);
    
    if (classInfo) {
        setSelectedClassData({
            id: classInfo.id,
            name: `${classInfo.grade?.name || ''} ${classInfo.section || ''}`.trim() || 'N/A',
            shift: classInfo.shift || 'N/A',
            classroom: classInfo.classroom || 'N/A',
            academic_year: targetAcademicYear, // Use the targetAcademicYear passed
        });
    } else {
        // Fallback if classInfo not found (e.g., if directly called or state mismatch)
        // Set basic info based on what's passed.
        setSelectedClassData({
            id: classIdToFetch,
            name: 'Loading...', // Will be updated by schedule response
            shift: 'Loading...', // Will be updated
            classroom: 'Loading...', // Will be updated
            academic_year: targetAcademicYear,
        });
    }

    try {
      // Ensure targetAcademicYear is always provided. If it might be undefined, handle that.
      const url = `/schedules/class/${classIdToFetch}?academic_year=${targetAcademicYear}`;
      const res = await axios.get(url);

      if (res.data && res.data.schedule && Object.keys(res.data.schedule).length > 0) {
        setSchedule(res.data.schedule);
        setSelectedClassData(prev => ({
          ...prev, // Keep ID, etc. from classInfo if set
          id: classIdToFetch, // ensure id is set
          name: res.data.class_name || prev?.name || 'N/A',
          shift: res.data.shift || prev?.shift || 'N/A',
          classroom: res.data.classroom || prev?.classroom || 'N/A',
          academic_year: res.data.academic_year, // This should be the definitive academic year for the schedule
        }));
      } else {
        setFetchScheduleError(res.data?.message || `Schedule data not found for this class for the academic year ${targetAcademicYear}.`);
        setSchedule({}); // Set to empty object for "no schedule data"
        setSelectedClassData(prev => ({
            ...prev,
            id: classIdToFetch,
            name: res.data.class_name || prev?.name || 'N/A',
            shift: res.data.shift || prev?.shift || 'N/A',
            classroom: res.data.classroom || prev?.classroom || 'N/A',
            academic_year: res.data.academic_year || targetAcademicYear, // Prioritize response, then passed param
        }));
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setFetchScheduleError( err.response?.data?.message || 'Failed to fetch schedule.');
      setSchedule(null); // Error, so no schedule
      // Update selectedClassData to reflect the class for which the fetch failed
      setSelectedClassData(prev => ({
          ...prev, // Keep existing info like name if available from classInfo
          id: classIdToFetch,
          academic_year: targetAcademicYear, // Keep the academic year we attempted to fetch
      }));
    }
    setLoadingSchedule(false);
  };

  const handleDeleteSchedule = async () => {
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
      // Optionally, you might want to clear selectedClassData or re-fetch classes
      // setSelectedClassData(null);
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete schedule.');
    }
    setDeleteInProgress(false);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setSelectedClassData(null);
    setSchedule(null);
    setFetchClassesError(''); // Clear class fetching error on filter change
    setFetchScheduleError('');
    setDeleteSuccessMessage('');
    setDeleteError('');
  };

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

      {/* Filters Section */}
      <div className="mb-8 p-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Filter Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterAcademicYear" className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              id="filterAcademicYear"
              value={filterAcademicYear}
              onChange={handleFilterChange(setFilterAcademicYear)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Academic Years</option>
              {academicYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterGrade" className="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <select
              id="filterGrade"
              value={filterGradeId}
              onChange={handleFilterChange(setFilterGradeId)}
              disabled={loadingFilters || grades.length === 0}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">All Grades</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id}>{grade.name}</option>
              ))}
            </select>
            {loadingFilters && <p className="text-xs text-gray-500 mt-1">Loading grades...</p>}
            {!loadingFilters && grades.length === 0 && <p className="text-xs text-red-500 mt-1">No grades found. Add grades first.</p>}
          </div>

          <div>
            <label htmlFor="filterShift" className="block text-sm font-medium text-gray-700 mb-1">
              Shift
            </label>
            <select
              id="filterShift"
              value={filterShift}
              onChange={handleFilterChange(setFilterShift)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Shifts</option>
              {shiftOptions.map(shift => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section to select class */}
      <div className="mb-10 p-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Select a Class to View Schedule</h2>
        {loadingClasses && <p className="text-gray-700 text-center py-4">Loading classes...</p>}
        {fetchClassesError && !loadingClasses && classes.length === 0 && (
          <p className="text-red-600 bg-red-100 p-4 rounded-lg shadow text-center">{fetchClassesError}</p>
        )}
        {!loadingClasses && !fetchClassesError && classes.length === 0 && (
          <p className="text-gray-700 bg-gray-100 p-4 rounded-lg shadow text-center">No classes available. Try adjusting filters or add classes to the system.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {classes.map((cls) => (
            <div
              key={`${cls.id}-${cls.academic_year}`} // Unique key if class ID can repeat across academic years
              className={`p-4 rounded-xl shadow-md cursor-pointer transition duration-150
                ${selectedClassData && selectedClassData.id === cls.id && selectedClassData.academic_year === cls.academic_year
                  ? 'bg-blue-200 border-2 border-blue-500 ring-2 ring-blue-300'
                  : 'bg-white hover:bg-blue-50 hover:shadow-lg'}`}
              onClick={() => fetchSchedule(cls.id, cls.academic_year)} // Pass cls.academic_year
            >
              <h3 className="text-lg font-semibold text-blue-700">
                {cls.grade?.name || 'N/A'} {cls.section || ''}
              </h3>
              <p className="text-sm text-gray-600">Shift: {cls.shift || 'N/A'}</p>
              <p className="text-sm text-gray-600">Classroom: {cls.classroom || 'N/A'}</p>
              <p className="text-sm text-gray-600">Academic Year: {cls.academic_year || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>


      {loadingSchedule && <p className="text-center text-gray-600 py-4">Loading schedule...</p>}

      {selectedClassData && !loadingSchedule && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
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

            {deleteError && <p className="text-sm text-red-600 mb-4 p-2 bg-red-50 rounded-md">{deleteError}</p>}
            {deleteSuccessMessage && <p className="text-sm text-green-600 mb-4 p-2 bg-green-50 rounded-md">{deleteSuccessMessage}</p>}
            {fetchScheduleError && <p className="text-center text-red-600 py-4 mb-4 bg-red-50 rounded-md">{fetchScheduleError}</p>}


            {schedule && Object.keys(schedule).length === 0 && !fetchScheduleError && !deleteSuccessMessage && (
               <p className="text-center text-gray-500 py-6">No schedule data available for this class and academic year.</p>
            )}

            {schedule && Object.keys(schedule).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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