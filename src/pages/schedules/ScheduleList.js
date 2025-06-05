import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// Define your API base URL - good practice
// const API_BASE_URL = '/api'; // Adjust if your Laravel API prefix is different

const ScheduleList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null); // Store full class data object
  const [schedule, setSchedule] = useState(null); // Will be an object: { Monday: [...], Tuesday: [...] }
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [generateMessage, setGenerateMessage] = useState('');
  const [fetchScheduleError, setFetchScheduleError] = useState('');

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    setGenerateMessage(''); // Clear previous generation messages
    try {
      // Use template literal for consistency and clarity
      const res = await axios.get(`/gradeclasses`);
      setClasses(res.data || []); // Ensure classes is an array
    } catch (err) {
      console.error('Error fetching classes:', err);
      setGenerateMessage('Error fetching class list.'); // Show error to user
    }
    setLoadingClasses(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchSchedule = async (classId) => {
    setLoadingSchedule(true);
    setSchedule(null); // Clear previous schedule
    setSelectedClassData(null); // Clear previous class data
    setFetchScheduleError(''); // Clear previous errors
    try {
      const res = await axios.get(`/schedules/class/${classId}`);
      console.log('Fetched Schedule API Response:', res.data); // IMPORTANT: Check this log

      if (res.data && res.data.schedule) {
        setSchedule(res.data.schedule);
        // Store the relevant parts of the class data from the schedule response
        setSelectedClassData({
          name: res.data.class_name, // Corrected from res.data.class
          shift: res.data.shift,
          classroom: res.data.classroom,
          academic_year: res.data.academic_year,
        });
      } else {
        setFetchScheduleError('Schedule data not found in the response.');
        setSchedule({}); // Set to empty object to indicate no schedule available
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setFetchScheduleError(
        err.response?.data?.message || 'Failed to fetch schedule. Please try again.'
      );
      setSchedule(null); // Ensure schedule is null on error
    }
    setLoadingSchedule(false);
  };

  const generateSchedules = async () => {
    if (!academicYear.trim()) {
      setGenerateMessage('Please enter an academic year.');
      return;
    }
    setLoadingClasses(true); // Or a new loading state for generation
    setGenerateMessage('Generating schedules...');
    try {
      const res = await axios.post(`/schedules/generate`, {
        academic_year: academicYear,
      });
      setGenerateMessage(res.data.message || 'Schedules generated.');
      // Optionally, clear selected schedule or refetch classes if generation affects current view
      // fetchClasses(); // You have this, which is good if generation creates new classes
      setSchedule(null); // Clear displayed schedule as it might be outdated
      setSelectedClassData(null);
    } catch (err) {
      console.error('Error generating schedules:', err);
      setGenerateMessage(
        err.response?.data?.message || 'Failed to generate schedules. Check logs.'
      );
    }
    setLoadingClasses(false); // Reset loading state
  };

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-white-50 min-h-screen">
  <h1 className="text-4xl font-bold mb-8 text-blue-900">📅 School Schedules</h1>

  <div className="mb-8 p-6 bg-white shadow-lg rounded-2xl">
    <h2 className="text-2xl font-semibold mb-4 text-blue-800">Generate New Schedules</h2>
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <input
        type="text"
        placeholder="Academic Year (e.g., 2023-2024)"
        value={academicYear}
        onChange={(e) => {
          setAcademicYear(e.target.value);
          if (generateMessage) setGenerateMessage('');
        }}
        className="border p-3 rounded-md w-full sm:w-64 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        onClick={generateSchedules}
        disabled={loadingClasses}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
      >
        {loadingClasses ? 'Processing...' : 'Generate Schedules'}
      </button>
    </div>
    {generateMessage && (
      <p className={`mt-4 text-sm ${generateMessage.includes('Error') || generateMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
        {generateMessage}
      </p>
    )}
  </div>

  <div className="mb-10">
    <h2 className="text-2xl font-semibold mb-4 text-blue-800">Select a Class</h2>
    {loadingClasses && <p className="text-gray-700">Loading classes...</p>}
    {!loadingClasses && classes.length === 0 && (
      <p className="text-gray-700">No classes found. Generate schedules or add classes first.</p>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {classes.map((cls) => (
        <div
          key={cls.id}
          className={`p-4 rounded-xl shadow-md cursor-pointer transition duration-150 
            ${selectedClassData && selectedClassData.name === `${cls.grade.name} ${cls.section}`
              ? 'bg-blue-100 border border-blue-400'
              : 'bg-white hover:bg-blue-100 hover:shadow-lg'}`}
          onClick={() => fetchSchedule(cls.id)}
        >
          <h3 className="text-lg font-semibold text-blue-700">
            {cls.grade?.name || 'N/A'} {cls.section || ''}
          </h3>
          <p className="text-sm text-gray-600">Shift: {cls.shift || 'N/A'}</p>
          <p className="text-sm text-gray-600">Year: {cls.academic_year || 'N/A'}</p>
        </div>
      ))}
    </div>
  </div>

  {loadingSchedule && <p className="text-center text-gray-600 py-4">Loading schedule...</p>}
  {fetchScheduleError && <p className="text-center text-red-600 py-4">{fetchScheduleError}</p>}

  {!loadingSchedule && selectedClassData && schedule && (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-2">
        Schedule for {selectedClassData.name}
      </h2>
      <div className="text-sm text-gray-700 mb-6 space-x-4">
        <span>Shift: {selectedClassData.shift}</span>
        <span>|</span>
        <span>Classroom: {selectedClassData.classroom || 'N/A'}</span>
        <span>|</span>
        <span>Academic Year: {selectedClassData.academic_year}</span>
      </div>

      {Object.keys(schedule).length === 0 && !fetchScheduleError && (
        <p className="text-center text-gray-500 py-6">No schedule data available for this class.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOrder
          .filter(day => schedule[day] && schedule[day].length > 0)
          .map((day) => (
            <div key={day} className="bg-blue-100 p-4 rounded-lg shadow border border-blue-200">
              <h3 className="text-lg font-bold mb-3 text-blue-900 capitalize">{day}</h3>
              <ul className="space-y-2">
                {schedule[day].map((slot, i) => (
                  <li key={i} className="p-3 bg-white rounded-md border border-gray-300">
                    <div className="font-medium text-blue-700">{slot.time}</div>
                    <div className="text-gray-800">{slot.subject}</div>
                    <div className="text-gray-500 text-xs">Teacher: {slot.teacher}</div>
                  </li>
                ))}
              </ul>
            </div>
        ))}
      </div>
    </div>
  )}
</div>

  );
};

export default ScheduleList;