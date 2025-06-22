import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios'; // Assumes AuthContext sets baseURL and Authorization headers

// --- Helper Functions (similar to TeacherScheduleView) ---
const getCurrentAcademicYearFrontend = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentCalendarYear = new Date().getFullYear();
    if (currentMonth >= 7) return String(currentCalendarYear + 1);
    return String(currentCalendarYear);
};

const generateAcademicYearOptions = () => {
    const determinedCurrentAcademicYear = parseInt(getCurrentAcademicYearFrontend(), 10);
    const options = [];
    for (let i = -2; i <= 2; i++) {
        options.push(String(determinedCurrentAcademicYear + i));
    }
    return options;
};

const displayDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- Component ---
const AdminTeacherScheduleView = () => {
  const [allTeachers, setAllTeachers] = useState([]); // To populate teacher dropdown
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedTeacherName, setSelectedTeacherName] = useState(''); // For display

  const [teacherSchedule, setTeacherSchedule] = useState(null);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [fetchError, setFetchError] = useState(''); // General error for teachers or schedule

  const [selectedAcademicYear, setSelectedAcademicYear] = useState(getCurrentAcademicYearFrontend());
  const academicYearOptions = useMemo(() => generateAcademicYearOptions(), []);

  // Fetch all teachers for the dropdown
  const fetchAllTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setFetchError('');
    try {
      // This endpoint needs to return all teachers, perhaps just ID and Name
      // Assumes you have a /teachers endpoint that admins can access for a list
      const response = await axios.get('/teachers'); // Admin's endpoint to get all teachers
      if (response.data && Array.isArray(response.data)) {
        setAllTeachers(response.data.map(t => ({ id: t.id, name: t.name }))); // Assuming structure
      } else {
        setAllTeachers([]);
        setFetchError('Could not load teachers list. Invalid data format.');
      }
    } catch (err) {
      console.error('Error fetching all teachers:', err);
      setAllTeachers([]);
      setFetchError(err.response?.data?.message || 'Failed to fetch teachers list.');
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTeachers();
  }, [fetchAllTeachers]);

  // Fetch schedule when selectedTeacherId or selectedAcademicYear changes
  useEffect(() => {
    const fetchScheduleForSelectedTeacher = async () => {
      if (!selectedTeacherId || !selectedAcademicYear) {
        setTeacherSchedule(null); // Clear schedule if no teacher or year selected
        setFetchError('');
        return;
      }

      setLoadingSchedule(true);
      setTeacherSchedule(null);
      setFetchError('');

      // Update selected teacher name for display
      const teacherInfo = allTeachers.find(t => t.id === parseInt(selectedTeacherId));
      setSelectedTeacherName(teacherInfo ? teacherInfo.name : 'Selected Teacher');


      try {
        const params = { academic_year: selectedAcademicYear };
        // NEW ENDPOINT: /admin/teachers/{teacher_id}/schedule
        const response = await axios.get(`/admin/teachers/${selectedTeacherId}/schedule`, { params });
        
        console.log(`API Response (/admin/teachers/${selectedTeacherId}/schedule for ${selectedAcademicYear}):`, response.data);
        if (response.data && typeof response.data === 'object') {
            setTeacherSchedule(response.data);
            const hasAnySchedule = Object.values(response.data).some(daySchedule => 
                Array.isArray(daySchedule) && daySchedule.length > 0
            );
            if (!hasAnySchedule) {
                setFetchError(`No teaching assignments found for the selected teacher in academic year ${selectedAcademicYear}.`);
            }
        } else {
            setFetchError('Received invalid schedule data format.');
            setTeacherSchedule({});
        }
      } catch (err) {
        console.error('Error fetching teacher schedule for admin:', err);
         if (err.response) {
            if (err.response.status === 401) setFetchError("Authentication error.");
            else if (err.response.status === 403) setFetchError("Not authorized to view this teacher's schedule.");
            else if (err.response.status === 404) setFetchError(`Schedule not found for selected teacher/year.`);
            else setFetchError(err.response.data?.message || `Failed to fetch schedule.`);
        } else if (err.request) setFetchError('No server response.');
        else setFetchError(`Error: ${err.message}`);
        setTeacherSchedule({});
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchScheduleForSelectedTeacher();
  }, [selectedTeacherId, selectedAcademicYear, allTeachers]); // Add allTeachers dependency

  // Memoized processing for schedule table (identical to TeacherScheduleView)
  const { uniqueTimeSlots, scheduleTableData } = useMemo(() => {
    if (!teacherSchedule || typeof teacherSchedule !== 'object' || Object.keys(teacherSchedule).length === 0) {
      return { uniqueTimeSlots: [], scheduleTableData: {} };
    }
    const allTimes = new Set();
    const preparedData = {};
    displayDays.forEach(dayKey => {
        const slotsForDay = teacherSchedule[dayKey];
        if (slotsForDay && Array.isArray(slotsForDay)) {
            slotsForDay.forEach(slot => {
                if (slot && slot.start_time && slot.end_time) {
                    const timeRange = `${slot.start_time} - ${slot.end_time}`;
                    allTimes.add(timeRange);
                    if (!preparedData[timeRange]) preparedData[timeRange] = {};
                    preparedData[timeRange][dayKey] = {
                        subject: slot.subject_name,
                        gradeClass: slot.gradeclass_name,
                        classroom: slot.classroom_name,
                    };
                }
            });
        }
    });
    const sortedTimes = Array.from(allTimes).sort((a, b) => {
      const parseTimeToMinutes = (timeRangeStr) => { /* ... same parsing logic as before ... */
        if (!timeRangeStr || typeof timeRangeStr !== 'string') return Infinity;
        const startTimeStr = timeRangeStr.split(' - ')[0]?.trim();
        if (!startTimeStr) return Infinity;
        const timeParts = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!timeParts) return Infinity;
        let hour = parseInt(timeParts[1], 10);
        const minute = parseInt(timeParts[2], 10);
        const modifier = timeParts[3] ? timeParts[3].toUpperCase() : null;
        if (isNaN(hour) || isNaN(minute)) return Infinity;
        if (modifier === 'PM' && hour < 12) hour += 12;
        if (modifier === 'AM' && hour === 12) hour = 0;
        return hour * 60 + minute;
      };
      return parseTimeToMinutes(a) - parseTimeToMinutes(b);
    });
    return { uniqueTimeSlots: sortedTimes, scheduleTableData: preparedData };
  }, [teacherSchedule]);

  const handleTeacherChange = (event) => {
    setSelectedTeacherId(event.target.value);
  };

  const handleAcademicYearChange = (event) => {
    setSelectedAcademicYear(event.target.value);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900">View Teacher Schedules</h1>
      </div>

      {/* Filters for Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-white shadow-lg rounded-2xl">
        <div>
          <label htmlFor="adminTeacherSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Teacher
          </label>
          {loadingTeachers ? (
            <p className="text-sm text-gray-500">Loading teachers...</p>
          ) : allTeachers.length === 0 && !fetchError ? (
            <p className="text-sm text-orange-600">No teachers found in the system.</p>
          ) : (
            <select
              id="adminTeacherSelect"
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">-- Select a Teacher --</option>
              {allTeachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name} </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="adminAcademicYearSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Academic Year
          </label>
          <select
            id="adminAcademicYearSelect"
            value={selectedAcademicYear}
            onChange={handleAcademicYearChange}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            {academicYearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* General Fetch Error Display */}
      {fetchError && !loadingSchedule && ( // Show only if not loading a schedule
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md text-center my-6" role="alert">
          <p className="font-bold">Notice</p>
          <p>{fetchError}</p>
        </div>
      )}
      
      {selectedTeacherId && loadingSchedule && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule for {selectedTeacherName || 'selected teacher'}...</p>
        </div>
      )}

      {selectedTeacherId && !loadingSchedule && !fetchError && teacherSchedule && uniqueTimeSlots.length === 0 && (
         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-md text-center my-6" role="alert">
          <p className="font-bold">No Assignments Found</p>
          <p>No teaching assignments found for {selectedTeacherName || 'this teacher'} in academic year {selectedAcademicYear}.</p>
        </div>
      )}

      {selectedTeacherId && !loadingSchedule && !fetchError && teacherSchedule && uniqueTimeSlots.length > 0 && (
        <div className="bg-white rounded-xl shadow-xl p-2 sm:p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-2">
            Schedule for {selectedTeacherName || 'Selected Teacher'}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Academic Year: <strong>{selectedAcademicYear}</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="border border-blue-400 p-3 text-left text-sm font-semibold sticky left-0 bg-blue-600 z-10 min-w-[120px]">Time</th>
                  {displayDays.map((day) => (
                    <th key={day} className="border border-blue-400 p-3 text-left text-sm font-semibold capitalize min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueTimeSlots.map((timeSlot) => (
                  <tr key={timeSlot} className="even:bg-gray-50 hover:bg-blue-50 transition-colors group">
                    <td className="border border-gray-300 p-2 text-sm text-gray-800 font-medium whitespace-nowrap sticky left-0 bg-white group-hover:bg-blue-50 z-0">
                      {timeSlot}
                    </td>
                    {displayDays.map((dayKey) => {
                      const slotData = scheduleTableData[timeSlot]?.[dayKey];
                      return (
                        <td key={`${dayKey}-${timeSlot}`} className="border border-gray-300 p-2 text-sm">
                          {slotData ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-indigo-700">{slotData.subject || 'N/A'}</div>
                              {slotData.gradeClass && <div className="text-xs text-gray-600">Class: {slotData.gradeClass}</div>}
                              {slotData.classroom && <div className="text-xs text-gray-500">Room: {slotData.classroom}</div>}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!selectedTeacherId && !loadingTeachers && !loadingSchedule && (
          <div className="text-center text-gray-500 py-10">Please select a teacher and academic year to view their schedule.</div>
      )}
    </div>
  );
};

export default AdminTeacherScheduleView;