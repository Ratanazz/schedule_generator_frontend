import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define the order of days for the table columns (lowercase for keys, used in useMemo)
const tableDisplayDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const academicYearOptions = Array.from({ length: 7 }, (_, i) => `${2024 + i}`);
const shiftOptions = ["Morning", "Afternoon"];


const ScheduleList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [fetchClassesError, setFetchClassesError] = useState('');
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

  // State for Grade Subjects Summary
  const [gradeSubjectsSummary, setGradeSubjectsSummary] = useState([]);
  const [loadingGradeSubjects, setLoadingGradeSubjects] = useState(false);
  const [fetchGradeSubjectsError, setFetchGradeSubjectsError] = useState('');

  const fetchGradesForFilter = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const res = await axios.get('/grades');
      setGrades(res.data || []);
    } catch (err) {
      console.error('Error fetching grades for filter:', err);
    }
    setLoadingFilters(false);
  }, []);

  useEffect(() => {
    fetchGradesForFilter();
  }, [fetchGradesForFilter]);

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    setClasses([]);
    setSelectedClassData(null);
    setSchedule(null);
    setGradeSubjectsSummary([]); // Reset subject summary
    setFetchClassesError('');
    setFetchScheduleError('');
    setFetchGradeSubjectsError(''); // Reset subject summary error
    setDeleteError('');
    setDeleteSuccessMessage('');

    const queryParams = {};
    if (filterAcademicYear) queryParams.academic_year = filterAcademicYear;
    if (filterGradeId) queryParams.grade_id = filterGradeId;
    if (filterShift) queryParams.shift = filterShift;

    try {
      const response = await axios.get('/gradeclasses', { params: queryParams });
      setClasses(response.data || []);
      if (response.data && response.data.length === 0) {
        setFetchClassesError('No classes found matching your criteria.');
      }
    } catch (err)
     {
      console.error('Error fetching classes:', err);
      setFetchClassesError(err.response?.data?.message || 'Failed to fetch classes.');
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, [filterAcademicYear, filterGradeId, filterShift]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);


  const fetchGradeSubjectsSummary = useCallback(async (gradeId) => {
    if (!gradeId) {
      setGradeSubjectsSummary([]);
      setFetchGradeSubjectsError('Grade ID not available to fetch subjects summary.');
      return;
    }
    setLoadingGradeSubjects(true);
    setGradeSubjectsSummary([]);
    setFetchGradeSubjectsError('');
    try {
      const response = await axios.get(`/grades/${gradeId}/subjects`);
      
      if (response.data && Array.isArray(response.data)) {
        const transformedData = response.data.map(item => ({
          subject_id: item.id,
          subject_name: item.name,
          study_hours: item.pivot?.study_hours !== undefined ? item.pivot.study_hours : 'N/A',
        }));
        setGradeSubjectsSummary(transformedData);

        if (transformedData.length === 0) {
          setFetchGradeSubjectsError('No subjects found for this grade or study hours not set.');
        }
      } else {
        setGradeSubjectsSummary([]);
        setFetchGradeSubjectsError('Invalid data format received for grade subjects summary.');
      }
    } catch (err) {
      console.error('Error fetching grade subjects summary:', err);
      setFetchGradeSubjectsError(err.response?.data?.message || 'Failed to fetch grade subjects summary.');
      setGradeSubjectsSummary([]);
    } finally {
      setLoadingGradeSubjects(false);
    }
  }, []);

  const fetchSchedule = async (classIdToFetch, targetAcademicYear) => {
    setLoadingSchedule(true);
    setSchedule(null);
    setFetchScheduleError('');
    setDeleteError('');
    setDeleteSuccessMessage('');
    setIsDeleting(false);
    
    setGradeSubjectsSummary([]);
    setFetchGradeSubjectsError('');
    setLoadingGradeSubjects(false);

    const classInfoFromList = classes.find(c => c.id === classIdToFetch && c.academic_year === targetAcademicYear);
    
    let initialSelectedData = {
        id: classIdToFetch,
        name: 'Loading...',
        shift: 'Loading...',
        classroom: 'Loading...',
        academic_year: targetAcademicYear,
        grade_id: null,
        grade_name: null,
    };

    if (classInfoFromList) {
        initialSelectedData = {
            ...initialSelectedData,
            name: `${classInfoFromList.grade?.name || ''} ${classInfoFromList.section || ''}`.trim() || 'N/A',
            shift: classInfoFromList.shift || 'N/A',
            classroom: classInfoFromList.classroom || 'N/A',
            grade_id: classInfoFromList.grade?.id,
            grade_name: classInfoFromList.grade?.name,
        };
    }
    setSelectedClassData(initialSelectedData);

    try {
      const url = `/schedules/class/${classIdToFetch}?academic_year=${targetAcademicYear}`;
      const res = await axios.get(url);
      const apiClassData = res.data || {};

      const finalSelectedData = {
        id: classIdToFetch,
        name: apiClassData.class_name || initialSelectedData.name,
        shift: apiClassData.shift || initialSelectedData.shift,
        classroom: apiClassData.classroom || initialSelectedData.classroom,
        academic_year: apiClassData.academic_year || targetAcademicYear,
        grade_id: apiClassData.grade_id || initialSelectedData.grade_id,
        grade_name: apiClassData.grade_name || initialSelectedData.grade_name,
      };
      setSelectedClassData(finalSelectedData);

      if (apiClassData.schedule && Object.keys(apiClassData.schedule).length > 0) {
        setSchedule(apiClassData.schedule);
      } else {
        setFetchScheduleError(apiClassData.message || `Schedule data not found for this class for the academic year ${targetAcademicYear}.`);
        setSchedule({});
      }
      
      if (finalSelectedData.grade_id) {
        fetchGradeSubjectsSummary(finalSelectedData.grade_id);
      } else {
        setFetchGradeSubjectsError('Grade ID not available for the selected class. Cannot fetch subject summary.');
        setGradeSubjectsSummary([]);
      }

    } catch (err) {
      console.error('Error fetching schedule:', err);
      setFetchScheduleError(err.response?.data?.message || 'Failed to fetch schedule.');
      setSchedule(null);
      
      const currentGradeId = selectedClassData?.grade_id || initialSelectedData.grade_id;
      if (currentGradeId) {
         fetchGradeSubjectsSummary(currentGradeId);
      } else {
        setFetchGradeSubjectsError(prev => (prev ? prev + ' ' : '') + 'Grade ID also unavailable for subject summary.');
        setGradeSubjectsSummary([]);
      }
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
    setGradeSubjectsSummary([]);
    setFetchClassesError('');
    setFetchScheduleError('');
    setFetchGradeSubjectsError('');
    setDeleteSuccessMessage('');
    setDeleteError('');
  };

  const { uniqueTimeSlots, scheduleTableData } = useMemo(() => {
    if (!schedule || Object.keys(schedule).length === 0) {
      return { uniqueTimeSlots: [], scheduleTableData: {} };
    }
    const allTimes = new Set();
    const preparedData = {};
    Object.entries(schedule).forEach(([day, slots]) => {
      const dayKey = day.toLowerCase();
      if (tableDisplayDays.includes(dayKey) && slots && Array.isArray(slots)) {
        slots.forEach(slot => {
          if (slot && slot.time) {
            allTimes.add(slot.time);
            if (!preparedData[slot.time]) {
              preparedData[slot.time] = {};
            }
            preparedData[slot.time][dayKey] = {
              subject: slot.subject,
              teacher: slot.teacher,
            };
          }
        });
      }
    });
    const sortedTimes = Array.from(allTimes).sort((a, b) => {
      const parseTime = (timeStr) => {
          if (!timeStr || typeof timeStr !== 'string') return 99;
          const parts = timeStr.split('-');
          let hour = parseInt(parts[0], 10);
          if (isNaN(hour)) return 99;
          if (hour < 7) hour += 12; 
          return hour;
      };
      return parseTime(a) - parseTime(b);
    });
    return { uniqueTimeSlots: sortedTimes, scheduleTableData: preparedData };
  }, [schedule]);


  const handleExportToPDF = () => {
    if (!selectedClassData) {
        alert("Please select a class first.");
        return;
    }
    
    // Check if there's any schedule data to export
    const hasScheduleData = schedule && uniqueTimeSlots.length > 0;
    // Check if there's any subject summary data to export
    const hasSubjectSummaryData = gradeSubjectsSummary && gradeSubjectsSummary.length > 0;

    if (!hasScheduleData && !hasSubjectSummaryData) {
        alert("No schedule or subject summary data to export for the selected class.");
        return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageMargin = 14;
    let currentY = pageMargin; // Start Y position for content

    // Title
    doc.setFontSize(16);
    doc.text(`Schedule Information for ${selectedClassData.name}`, pageMargin, currentY);
    currentY += 7;
    doc.setFontSize(10);
    doc.text(
      `Academic Year: ${selectedClassData.academic_year} | Shift: ${selectedClassData.shift} | Classroom: ${selectedClassData.classroom || 'N/A'}`,
      pageMargin,
      currentY
    );
    currentY += 10; // Space before the first table

    // Main Schedule Table
    if (hasScheduleData) {
        const head = [[
            'Time',
            ...tableDisplayDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)) 
        ]];
        const body = uniqueTimeSlots.map(timeSlot => {
            const row = [timeSlot];
            tableDisplayDays.forEach(dayKey => {
            const slotData = scheduleTableData[timeSlot]?.[dayKey];
            if (slotData) {
                let cellText = slotData.subject || 'N/A';
                if (slotData.teacher) {
                cellText += `\n(${slotData.teacher})`; 
                }
                row.push(cellText);
            } else {
                row.push(''); 
            }
            });
            return row;
        });

        autoTable(doc, {
            head: head,
            body: body,
            startY: currentY, 
            theme: 'grid', 
            styles: {
            fontSize: 8,
            cellPadding: 1.5,
            overflow: 'linebreak', 
            halign: 'center',
            valign: 'middle',
            },
            headStyles: {
            fillColor: [219, 234, 254], 
            textColor: [30, 58, 138],   
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            },
            columnStyles: {
            0: { cellWidth: 'auto', fontStyle: 'bold', halign: 'left' }, 
            },
            
            didParseCell: function (data) { // Use didParseCell for consistent access to settings
               
            },
        });
        currentY = doc.lastAutoTable.finalY + 10; // Update Y position after the table
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150); // Gray color for placeholder text
        doc.text("No schedule data available for this class.", pageMargin, currentY);
        currentY += 10;
        doc.setTextColor(0); // Reset text color
    }


    // Subject Study Hours Section
    if (hasSubjectSummaryData && selectedClassData.grade_name) {
        
        const subjectSectionEstimatedHeight = 15 + (gradeSubjectsSummary.length * 5) ; // Title + rows
        if (currentY + subjectSectionEstimatedHeight > doc.internal.pageSize.height - pageMargin) {
            doc.addPage();
            currentY = pageMargin; // Reset Y for new page
        }
        
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 138); // Blue color for heading
        doc.text(`Subject Hours for Grade  ${selectedClassData.grade_name}`, pageMargin, currentY);
        currentY += 4; // Space after title

        const subjectHead = [['Subject', 'Hours']];
        const subjectBody = gradeSubjectsSummary.map(subject => [
            subject.subject_name,
            `${subject.study_hours} H`
        ]);

        autoTable(doc, {
            head: subjectHead,
            body: subjectBody,
            startY: currentY,
            theme: 'striped', // Or 'grid' or 'plain'
            headStyles: {
                fillColor: null, // Light blue[224, 233, 248]
                textColor: [0, 0, 0],
                fontStyle: 'bold',
            },
            styles: {
                fontSize: 9,
                cellPadding:1,
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 'auto' }, // Let column 0 be auto
                1: { cellWidth: 'wrap', halign: 'right' },    // 
            },
            tableWidth: 'wrap', // Key change: Make table width fit content
            margin: { left: pageMargin } // Ensure it respects the left margin
        });
        // 
    } else if (hasSubjectSummaryData && !selectedClassData.grade_name) {
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Subject summary available, but grade name is missing.", pageMargin, currentY);
        currentY += 5;
        doc.setTextColor(0);
    }
    

    const fileName = `schedule_info_${selectedClassData.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${selectedClassData.academic_year}.pdf`;
    doc.save(fileName);
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
              key={`${cls.id}-${cls.academic_year}`}
              className={`p-4 rounded-xl shadow-md cursor-pointer transition duration-150
                ${selectedClassData && selectedClassData.id === cls.id && selectedClassData.academic_year === cls.academic_year
                  ? 'bg-blue-200 border-2 border-blue-500 ring-2 ring-blue-300'
                  : 'bg-white hover:bg-blue-50 hover:shadow-lg'}`}
              onClick={() => fetchSchedule(cls.id, cls.academic_year)}
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
              
              {selectedClassData.academic_year && selectedClassData.academic_year !== 'N/A' && 
               ( (schedule && Object.keys(schedule).length > 0 && uniqueTimeSlots.length > 0) || (gradeSubjectsSummary && gradeSubjectsSummary.length > 0) ) && (
                <div className="mt-3 sm:mt-0 flex flex-col items-end sm:items-start sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                  {/* Show export button if either schedule OR subject summary has data */}
                  {((uniqueTimeSlots.length > 0) || (gradeSubjectsSummary && gradeSubjectsSummary.length > 0)) && !isDeleting && (
                    <button
                      onClick={handleExportToPDF}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md text-sm flex items-center w-full sm:w-auto justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export PDF
                    </button>
                  )}
                  
                  {/* Delete button only appears if there's an actual schedule to delete */}
                  {schedule && Object.keys(schedule).length > 0 && uniqueTimeSlots.length > 0 && !isDeleting ? (
                    <button
                        onClick={() => {
                        setIsDeleting(true); setDeleteError(''); setDeleteSuccessMessage('');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md text-sm flex items-center w-full sm:w-auto justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete Schedule
                    </button>
                    ) : schedule && Object.keys(schedule).length > 0 && uniqueTimeSlots.length > 0 && isDeleting && (
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
            
            {/* Conditional rendering for Schedule Table */}
            {fetchScheduleError && (!schedule || Object.keys(schedule).length === 0 || uniqueTimeSlots.length === 0) &&
                <p className="text-center text-red-600 py-4 mb-4 bg-red-50 rounded-md">{fetchScheduleError}</p>
            }
            {schedule && Object.keys(schedule).length === 0 && !fetchScheduleError && !deleteSuccessMessage && uniqueTimeSlots.length === 0 &&
               <p className="text-center text-gray-500 py-6">No schedule data available for this class and academic year.</p>
            }
            {schedule && Object.keys(schedule).length > 0 && uniqueTimeSlots.length > 0 && !deleteSuccessMessage && (
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-blue-900 sticky left-0 bg-blue-100 z-10">Time</th>
                      {tableDisplayDays.map((day) => (
                        <th key={day} className="border border-gray-300 p-3 text-left text-sm font-semibold text-blue-900 capitalize">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueTimeSlots.map((timeSlot) => (
                      <tr key={timeSlot} className="even:bg-white odd:bg-blue-50 hover:bg-blue-100 transition-colors">
                        <td className="border border-gray-300 p-2 text-sm text-gray-700 font-medium whitespace-nowrap sticky left-0 bg-inherit z-10">
                          {timeSlot}
                        </td>
                        {tableDisplayDays.map((dayKey) => {
                          const slotData = scheduleTableData[timeSlot]?.[dayKey];
                          return (
                            <td key={`${dayKey}-${timeSlot}`} className="border border-gray-300 p-2 text-sm min-w-[120px]">
                              {slotData ? (
                                <div>
                                  <div className="font-semibold text-blue-700">{slotData.subject}</div>
                                  {slotData.teacher && <div className="text-xs text-gray-500"> {slotData.teacher}</div>}
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
            )}
            
            {/* Subject Study Hours Section */}
            {selectedClassData && selectedClassData.grade_id && (
              
              <div className={`mt-1 pt-1 border-t border-gray-200 ${(schedule && Object.keys(schedule).length > 0 && uniqueTimeSlots.length > 0) ? 'mt-2' : 'mt-1'}`}>
                <h3 className="text-s font-semibold text-blue-500 mb-1">
                  Subject Hours for Grade {selectedClassData.grade_name || 'Selected Grade'}
                </h3>
                {loadingGradeSubjects && <p className="text-gray-400 py-2">Loading subject summary...</p>}
                {fetchGradeSubjectsError && !loadingGradeSubjects && (
                  <p className="text-red-500 bg-red-50 p-3 rounded-md my-2">{fetchGradeSubjectsError}</p>
                )}
                {!loadingGradeSubjects && !fetchGradeSubjectsError && gradeSubjectsSummary.length > 0 && (
                  <ul className="justshow">
                    {gradeSubjectsSummary.map(subject => (
                      <li key={subject.subject_id} className="bg-gray-50 p-2.5  ">
                        <span className="font-small text-gray-700 text-s">{subject.subject_name}</span>
                        <span className="text-s text-blue-600 font-semibold ml-2   ">{subject.study_hours} H</span>
                      </li>
                    ))}
                  </ul>
                )}
                {!loadingGradeSubjects && gradeSubjectsSummary.length === 0 && !fetchGradeSubjectsError && (
                  <p className="text-gray-500 py-2">No subject summary available for this grade, or study hours are not configured.</p>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ScheduleList;