import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; // Assumes AuthContext sets baseURL and Authorization headers

// --- Helper Functions ---

// Function to determine the default "current" academic year for the frontend.
// This logic MUST ALIGN with your backend's default if no academic_year is passed.
const getCurrentAcademicYearFrontend = () => {
    // Example: If "Academic Year 2025" refers to the school year that ENDS in 2025 (e.g., 2024-2025)
    const currentMonth = new Date().getMonth() + 1; // 1 (Jan) - 12 (Dec)
    const currentCalendarYear = new Date().getFullYear();
    
    if (currentMonth >= 7) { 
        return String(currentCalendarYear + 1); 
    } else {
        return String(currentCalendarYear); 
    }
    
};

// Generate academic year options (e.g., current year +/- 2 years)
const generateAcademicYearOptions = () => {
    const baseYear = new Date().getFullYear(); // Current calendar year
    const options = [];
    // Example: show last 2 years, current year, next 2 years based on how you define "academic year"
    // If current academic year (ending) is 2025, you might want options like 2023, 2024, 2025, 2026, 2027
    const determinedCurrentAcademicYear = parseInt(getCurrentAcademicYearFrontend(), 10);
    for (let i = -2; i <= 2; i++) {
        options.push(String(determinedCurrentAcademicYear + i));
    }
    return options;
    // Or a fixed range if preferred:
    // return Array.from({ length: 7 }, (_, i) => `${2023 + i}`);
};

// Order of days for display in the table. Must match keys from backend response.
const displayDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// const displayDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; // If Sunday is not used

// --- Component ---
const TeacherScheduleView = () => {
  const [teacherSchedule, setTeacherSchedule] = useState(null); // { Monday: [], Tuesday: [], ... }
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [fetchScheduleError, setFetchScheduleError] = useState('');
  
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(getCurrentAcademicYearFrontend());
  const academicYearOptions = useMemo(() => generateAcademicYearOptions(), []);


  useEffect(() => {
    const fetchMySchedule = async () => {
      if (!selectedAcademicYear) {
        setFetchScheduleError("Please select an academic year.");
        setTeacherSchedule({}); // Clear schedule
        setLoadingSchedule(false);
        return;
      }

      setLoadingSchedule(true);
      setTeacherSchedule(null); // Clear previous schedule
      setFetchScheduleError('');

      try {
        const params = { academic_year: selectedAcademicYear };
        const response = await axios.get('/teacher/my-schedule', { params }); // Endpoint is relative to baseURL
        
        console.log(`API Response (/teacher/my-schedule for ${selectedAcademicYear}):`, response.data);
        if (response.data && typeof response.data === 'object') {
            setTeacherSchedule(response.data);
            const hasAnySchedule = Object.values(response.data).some(daySchedule => 
                Array.isArray(daySchedule) && daySchedule.length > 0
            );
            if (!hasAnySchedule) {
                setFetchScheduleError(`No teaching assignments found for you in the academic year ${selectedAcademicYear}.`);
            }
        } else {
            setFetchScheduleError('Received invalid schedule data format from the server.');
            setTeacherSchedule({});
        }
      } catch (err) {
        console.error('Error fetching teacher schedule:', err);
        if (err.response) {
             if (err.response.status === 401) {
                 setFetchScheduleError("Authentication error. Your session may have expired. Please log in again.");
             } else if (err.response.status === 403) {
                setFetchScheduleError("You are not authorized to view this schedule. Please ensure you are logged in as a teacher with a linked profile.");
             } else if (err.response.status === 404) {
                 setFetchScheduleError(`No schedule found for academic year ${selectedAcademicYear}. Your teacher profile might not be linked or have assignments for this year.`);
             } else {
                 setFetchScheduleError(err.response.data?.message || `Failed to fetch schedule (Status: ${err.response.status}).`);
             }
        } else if (err.request) {
             setFetchScheduleError('No response from server. Check network connection or if the API is running.');
        } else {
            setFetchScheduleError(`Error fetching schedule: ${err.message}`);
        }
        setTeacherSchedule({}); // Set to empty object on error
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchMySchedule();
  }, [selectedAcademicYear]); // Re-fetch if selectedAcademicYear changes

  const { uniqueTimeSlots, scheduleTableData } = useMemo(() => {
    if (!teacherSchedule || typeof teacherSchedule !== 'object' || Object.keys(teacherSchedule).length === 0) {
      return { uniqueTimeSlots: [], scheduleTableData: {} };
    }

    const allTimes = new Set();
    const preparedData = {}; // { "08:00 AM - 09:00 AM": { "Monday": { subject, gradeClass }, ... }, ... }

    displayDays.forEach(dayKey => { // dayKey will be "Monday", "Tuesday", etc.
        const slotsForDay = teacherSchedule[dayKey]; // Access using the exact key from backend
        if (slotsForDay && Array.isArray(slotsForDay)) {
            slotsForDay.forEach(slot => {
                if (slot && slot.start_time && slot.end_time) {
                    const timeRange = `${slot.start_time} - ${slot.end_time}`; // e.g., "08:00 AM - 09:00 AM"
                    allTimes.add(timeRange);
                    if (!preparedData[timeRange]) {
                        preparedData[timeRange] = {};
                    }
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
      const parseTimeToMinutes = (timeRangeStr) => {
        if (!timeRangeStr || typeof timeRangeStr !== 'string') return Infinity;
        // Get the start time part (e.g., "08:00 AM" from "08:00 AM - 09:00 AM")
        const startTimeStr = timeRangeStr.split(' - ')[0]?.trim();
        if (!startTimeStr) return Infinity;

        const timeParts = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!timeParts) return Infinity;

        let hour = parseInt(timeParts[1], 10);
        const minute = parseInt(timeParts[2], 10);
        const modifier = timeParts[3] ? timeParts[3].toUpperCase() : null;

        if (isNaN(hour) || isNaN(minute)) return Infinity;

        if (modifier === 'PM' && hour < 12) hour += 12;
        if (modifier === 'AM' && hour === 12) hour = 0; // Midnight case (12 AM is 00 hours)
        
        return hour * 60 + minute;
      };
      return parseTimeToMinutes(a) - parseTimeToMinutes(b);
    });

    return { uniqueTimeSlots: sortedTimes, scheduleTableData: preparedData };
  }, [teacherSchedule]); // Rerun when teacherSchedule changes

  const handleAcademicYearChange = (event) => {
    setSelectedAcademicYear(event.target.value);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900">My Weekly Teaching Schedule</h1>
        <div className="mt-4 sm:mt-0">
            <label htmlFor="academicYearTeacher" className="sr-only">Select Academic Year</label>
            <select
                id="academicYearTeacher"
                value={selectedAcademicYear}
                onChange={handleAcademicYearChange}
                className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
                {academicYearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>
      </div>

      {loadingSchedule && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your schedule...</p>
        </div>
      )}

      {!loadingSchedule && fetchScheduleError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md text-center my-6" role="alert">
          <p className="font-bold">Could Not Load Schedule</p>
          <p>{fetchScheduleError}</p>
        </div>
      )}
      
      {!loadingSchedule && !fetchScheduleError && teacherSchedule && uniqueTimeSlots.length === 0 && (
         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-md text-center my-6" role="alert">
          <p className="font-bold">No Assignments Found</p>
          <p>You do not currently have any teaching assignments scheduled for the academic year {selectedAcademicYear}.</p>
        </div>
      )}

      {!loadingSchedule && !fetchScheduleError && teacherSchedule && uniqueTimeSlots.length > 0 && (
        <div className="bg-white rounded-xl shadow-xl p-2 sm:p-6">
          <p className="text-sm text-gray-600 mb-4">Displaying schedule for Academic Year: <strong>{selectedAcademicYear}</strong></p>
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
                    <td className="border border-gray-300 p-2 text-sm text-gray-800 font-medium whitespace-nowrap sticky left-0 bg-white group-hover:bg-blue-50 z-0"> {/* Removed z-10 from td for less aggressive stacking */}
                      {timeSlot}
                    </td>
                    {displayDays.map((dayKey) => { // dayKey is "Monday", "Tuesday", etc.
                      const slotData = scheduleTableData[timeSlot]?.[dayKey];
                      return (
                        <td key={`${dayKey}-${timeSlot}`} className="border border-gray-300 p-2 text-sm">
                          {slotData ? (
                            <div>
                              <div className="font-semibold text-indigo-700">{slotData.subject || 'N/A'}</div>
                              {slotData.gradeClass && <div className="text-xs text-gray-600">Grade: {slotData.gradeClass}</div>}
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
    </div>
  );
};

export default TeacherScheduleView;