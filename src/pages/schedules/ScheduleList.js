import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios'; // Assumes AuthContext sets baseURL and Authorization headers
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define the order of days for the table columns (lowercase for keys, used in useMemo)
const tableDisplayDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const currentYearForOptions = new Date().getFullYear();
const academicYearOptions = Array.from({ length: 7 }, (_, i) => `${currentYearForOptions - 3 + i}`);
const shiftOptions = ["Morning", "Afternoon", "Both"];

const ScheduleList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [schedule, setSchedule] = useState(null); // Expects: { Monday: [{time, subject, teacher}, ...], ...}
  
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [fetchClassesError, setFetchClassesError] = useState('');
  const [fetchScheduleError, setFetchScheduleError] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Filters State
  const [filterAcademicYear, setFilterAcademicYear] = useState(() => {
    const currentMonth = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    return currentMonth >= 7 ? String(year + 1) : String(year);
  });
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [grades, setGrades] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // State for Grade Subjects Summary
  const [gradeSubjectsSummary, setGradeSubjectsSummary] = useState([]);
  const [loadingGradeSubjects, setLoadingGradeSubjects] = useState(false);
  const [fetchGradeSubjectsError, setFetchGradeSubjectsError] = useState('');

  // Generic Loading Spinner Component
  const LoadingSpinner = ({ text = "Loading..." }) => (
    <div className="text-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  );

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
    setGradeSubjectsSummary([]);
    setFetchClassesError('');
    setFetchScheduleError('');
    setFetchGradeSubjectsError('');
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
        setFetchClassesError('No classes found matching your filter criteria.');
      }
    } catch (err) {
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
      setFetchGradeSubjectsError('');
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
          setFetchGradeSubjectsError('No subjects assigned to this grade or study hours not set.');
        }
      } else {
        setGradeSubjectsSummary([]);
        setFetchGradeSubjectsError('Invalid data for grade subjects summary.');
      }
    } catch (err) {
      console.error('Error fetching grade subjects summary:', err);
      setFetchGradeSubjectsError(err.response?.data?.message || 'Failed to fetch subject summary.');
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

    const classInfoFromList = classes.find(c => c.id === classIdToFetch && c.academic_year === targetAcademicYear);
    let initialSelectedData = {
        id: classIdToFetch, name: 'Loading...', shift: 'Loading...', classroom: 'Loading...',
        academic_year: targetAcademicYear, grade_id: null, grade_name: null,
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

      if (apiClassData.schedule && typeof apiClassData.schedule === 'object' && Object.keys(apiClassData.schedule).length > 0) {
        setSchedule(apiClassData.schedule); // This schedule object should have day keys like "Monday"
                                           // and slots with "time", "subject", "teacher"
        const hasAnySlots = Object.values(apiClassData.schedule).some(daySlots => Array.isArray(daySlots) && daySlots.length > 0);
        if (!hasAnySlots) {
             setFetchScheduleError(`Schedule data received, but no specific class times found for academic year ${targetAcademicYear}.`);
        }
      } else {
        setFetchScheduleError(apiClassData.message || `No schedule data found for this class in AY ${targetAcademicYear}.`);
        setSchedule({});
      }
      
      if (finalSelectedData.grade_id) fetchGradeSubjectsSummary(finalSelectedData.grade_id);
      else if (classInfoFromList?.grade?.id) fetchGradeSubjectsSummary(classInfoFromList.grade.id);
      else {
        setFetchGradeSubjectsError('Grade ID unavailable for subject summary.');
        setGradeSubjectsSummary([]);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setFetchScheduleError(err.response?.data?.message || 'Failed to fetch schedule.');
      setSchedule(null);
      const currentGradeId = selectedClassData?.grade_id || initialSelectedData.grade_id;
      if (currentGradeId) fetchGradeSubjectsSummary(currentGradeId);
      else {
        setFetchGradeSubjectsError(prev => (prev ? prev + ' ' : '') + 'Grade ID unavailable for summary.');
        setGradeSubjectsSummary([]);
      }
    }
    setLoadingSchedule(false);
  };

  const handleDeleteSchedule = async () => {
    if (!selectedClassData || !selectedClassData.id || !selectedClassData.academic_year) return;
    setDeleteInProgress(true); setDeleteError(''); setDeleteSuccessMessage('');
    try {
      await axios.delete(`/schedules/class/${selectedClassData.id}/academic-year/${selectedClassData.academic_year}`);
      setDeleteSuccessMessage(`Schedule for ${selectedClassData.name} (AY: ${selectedClassData.academic_year}) deleted.`);
      setSchedule(null); 
      setSelectedClassData(prev => prev ? {...prev, scheduleExists: false} : null);
      setIsDeleting(false);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete schedule.');
    }
    setDeleteInProgress(false);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setSelectedClassData(null); setSchedule(null); setGradeSubjectsSummary([]);
    setFetchClassesError(''); setFetchScheduleError(''); setFetchGradeSubjectsError('');
    setDeleteSuccessMessage(''); setDeleteError('');
  };

  // *** USEMEMO REVERTED TO PROCESS OLD DATA STRUCTURE ***
  const { uniqueTimeSlots, scheduleTableData } = useMemo(() => {
    // Expects `schedule` state to be:
    // { "Monday": [{time: "08:00-09:00", subject: "Math", teacher: "Smith"}, ...], ... }
    if (!schedule || typeof schedule !== 'object' || Object.keys(schedule).length === 0) {
      return { uniqueTimeSlots: [], scheduleTableData: {} };
    }

    const allTimes = new Set();
    const preparedData = {};
    
    Object.entries(schedule).forEach(([dayNameFromBackend, slots]) => { // dayNameFromBackend = "Monday", "Tuesday", etc.
      const dayKeyForTableDisplay = dayNameFromBackend.toLowerCase(); // "monday", "tuesday", ...

      if (tableDisplayDays.includes(dayKeyForTableDisplay) && slots && Array.isArray(slots)) {
        slots.forEach(slot => {
          // Expecting old structure: slot.time, slot.subject, slot.teacher
          if (slot && slot.time) { 
            allTimes.add(slot.time); // slot.time is like "08:00-09:00"

            if (!preparedData[slot.time]) {
              preparedData[slot.time] = {};
            }
            preparedData[slot.time][dayKeyForTableDisplay] = {
              subject: slot.subject || 'N/A',
              teacher: slot.teacher || 'N/A',
            };
          } else {
            // Log if a slot is missing the expected 'time' property
            // console.warn("Slot missing 'time' property:", slot, "on day:", dayNameFromBackend);
          }
        });
      }
    });
    
    const sortedTimes = Array.from(allTimes).sort((a, b) => {
      const parseTime = (timeStr) => { // This parseTime is for "08:00-09:00" like strings
          if (!timeStr || typeof timeStr !== 'string') return 99;
          const parts = timeStr.split('-');
          if (!parts[0]) return 99;
          const hourMinute = parts[0].split(':');
          let hour = parseInt(hourMinute[0], 10);
          if (isNaN(hour)) return 99;
          // Simple AM/PM heuristic for sorting if times are not 24hr and don't have AM/PM
          // This assumes single digit hours < 7 are PM for sorting purposes
          if (hour < 7 && hour > 0) hour += 12; // e.g. 1 (PM) becomes 13
          if (hour === 12 && parts[0].includes('AM')) hour = 0; // 12 AM is midnight
          return hour;
      };
      return parseTime(a) - parseTime(b);
    });

    return { uniqueTimeSlots: sortedTimes, scheduleTableData: preparedData };
  }, [schedule]);

  const handleExportToPDF = () => {
    if (!selectedClassData) { alert("Please select a class first."); return; }
    const hasScheduleData = schedule && uniqueTimeSlots.length > 0;
    const hasSubjectSummaryData = gradeSubjectsSummary && gradeSubjectsSummary.length > 0;
    if (!hasScheduleData && !hasSubjectSummaryData) { alert("No data to export."); return; }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageMargin = 14;
    let currentY = pageMargin;

    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text(`Schedule Information: ${selectedClassData.name || 'Selected Class'}`, pageMargin, currentY);
    currentY += 7; doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`Academic Year: ${selectedClassData.academic_year || 'N/A'} | Shift: ${selectedClassData.shift || 'N/A'} | Classroom: ${selectedClassData.classroom || 'N/A'}`, pageMargin, currentY);
    currentY += 10;

    if (hasScheduleData) {
        const head = [['Time', ...tableDisplayDays.map(day => day.charAt(0).toUpperCase() + day.slice(1))]];
        const body = uniqueTimeSlots.map(timeSlot => {
            const row = [timeSlot];
            tableDisplayDays.forEach(dayKeyForTable => {
                const slotData = scheduleTableData[timeSlot]?.[dayKeyForTable];
                row.push(slotData ? `${slotData.subject || 'N/A'}\n${slotData.teacher ? '(' + slotData.teacher + ')' : ''}`.trim() : '');
            });
            return row;
        });
        autoTable(doc, { head, body, startY: currentY, theme: 'grid', styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', halign: 'center', valign: 'middle'}, headStyles: { fillColor: [22, 78, 99], textColor: 255, fontStyle: 'bold', fontSize: 8 }, columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold', halign: 'left' } } });
        currentY = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(10); doc.setTextColor(150);
        doc.text("No schedule data to include in PDF.", pageMargin, currentY);
        currentY += 10; doc.setTextColor(0);
    }

    if (hasSubjectSummaryData && selectedClassData.grade_name) {
        const subjectSectionHeight = 15 + (gradeSubjectsSummary.length * 6);
        if (currentY + subjectSectionHeight > doc.internal.pageSize.height - pageMargin) {
            doc.addPage(); currentY = pageMargin;
        }
        doc.setFontSize(8); doc.setFont(undefined, 'bold');
        doc.text(`Subject Hours Summary for Grade ${selectedClassData.grade_name}`, pageMargin, currentY);
        currentY += 3;
        const subjectHead = [['Subject', 'Weekly Hours']];
        const subjectBody = gradeSubjectsSummary.map(s => [s.subject_name, `${s.study_hours} H`]);
        autoTable(doc, {
  head: subjectHead,
  body: subjectBody,
  startY: currentY,
  theme: 'striped',
  headStyles: {
    fillColor: [203, 213, 225],
    textColor: [30, 41, 59],
    fontStyle: 'bold'
  },
  styles: {
    fontSize: 6,
    cellPadding: 1.5
  },
  columnStyles: {
    0: { fontStyle: 'bold', cellWidth: 60 }, // Subject name
    1: { fontStyle: 'bold',halign: 'right', cellWidth: 25 }         // Weekly hours
  },
  tableWidth: 'wrap', // Ensures the table only takes as much width as needed
  margin: { left: pageMargin, right: pageMargin }
});
    }
    
    doc.save(`ClassSchedule-${selectedClassData.name.replace(/\s+/g, '_')}-${selectedClassData.academic_year}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900">📅 View Class Schedules</h1>
        <Link
          to="/schedules/generate-setup"
          className="mt-4 sm:mt-0 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-150 shadow-md text-sm font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L7 10.569 2.63 11.32c-1.53.11-2.15 2.01-1.09 3.07l3.25 3.18-1.07 4.62c-.3 1.29.99 2.33 2.18 1.65L10 19.28l4.01 2.46c1.19.68 2.48-.36 2.18-1.65l-1.07-4.62 3.25-3.18c1.06-1.06.44-2.96-1.09-3.07L13 10.57 11.49 3.17z" clipRule="evenodd" /></svg>
          Manage & Generate
        </Link>
      </div>

      {/* Filters Section */}
      <div className="mb-8 p-6 bg-white shadow-xl rounded-2xl">
        <h2 className="text-xl font-semibold text-blue-800 mb-5 border-b pb-3 border-gray-200">Filter Available Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="filterAcademicYear" className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select id="filterAcademicYear" value={filterAcademicYear} onChange={handleFilterChange(setFilterAcademicYear)} className="mt-1 block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors">
              {academicYearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="filterGrade" className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select id="filterGrade" value={filterGradeId} onChange={handleFilterChange(setFilterGradeId)} disabled={loadingFilters || grades.length === 0} className="mt-1 block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors">
              <option value="">All Grades</option>
              {grades.map(grade => (<option key={grade.id} value={grade.id}>{grade.name}</option>))}
            </select>
            {loadingFilters && <p className="text-xs text-gray-500 mt-1 italic">Loading grades...</p>}
            {!loadingFilters && grades.length === 0 && <p className="text-xs text-orange-600 mt-1">No grades found.</p>}
          </div>
          <div>
            <label htmlFor="filterShift" className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <select id="filterShift" value={filterShift} onChange={handleFilterChange(setFilterShift)} className="mt-1 block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors">
              <option value="">All Shifts</option>
              {shiftOptions.map(shift => (<option key={shift} value={shift}>{shift}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Section to select class */}
      <div className="mb-10 p-6 bg-white shadow-xl rounded-2xl">
        <h2 className="text-xl font-semibold text-blue-800 mb-5 border-b pb-3 border-gray-200">Select a Class to View Schedule</h2>
        {loadingClasses && <LoadingSpinner text="Finding matching classes..." />}
        
        {fetchClassesError && !loadingClasses && classes.length === 0 && (
          <div className="text-center py-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="font-medium">Could not load classes:</p>
            <p className="text-sm">{fetchClassesError}</p>
          </div>
        )}
        {!loadingClasses && !fetchClassesError && classes.length === 0 && (
          <div className="text-center py-6 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
            <p className="font-medium">No Classes Found</p>
            <p className="text-sm">There are no classes matching your current filter selection. Please adjust filters or ensure classes are added to the system for the selected academic year.</p>
          </div>
        )}
        
        {!loadingClasses && classes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {classes.map((cls) => (
                <div
                    key={`${cls.id}-${cls.academic_year}`}
                    className={`p-5 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105
                        ${selectedClassData?.id === cls.id && selectedClassData?.academic_year === cls.academic_year
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-blue-300 ring-offset-2'
                        : 'bg-white hover:shadow-2xl border border-gray-200'}`}
                    onClick={() => fetchSchedule(cls.id, cls.academic_year)}
                >
                    <h3 className={`text-lg font-semibold ${selectedClassData?.id === cls.id && selectedClassData?.academic_year === cls.academic_year ? 'text-white' : 'text-blue-700'}`}>
                        {cls.grade?.name || 'N/A'} {cls.section || ''}
                    </h3>
                    <p className={`text-sm ${selectedClassData?.id === cls.id && selectedClassData?.academic_year === cls.academic_year ? 'text-blue-100' : 'text-gray-600'}`}>Shift: {cls.shift || 'N/A'}</p>
                    <p className={`text-sm ${selectedClassData?.id === cls.id && selectedClassData?.academic_year === cls.academic_year ? 'text-blue-100' : 'text-gray-600'}`}>Room: {cls.classroom || 'N/A'}</p>
                    <p className={`text-sm ${selectedClassData?.id === cls.id && selectedClassData?.academic_year === cls.academic_year ? 'text-blue-200' : 'text-gray-500'}`}>Year: {cls.academic_year || 'N/A'}</p>
                </div>
            ))}
            </div>
        )}
      </div>

      {selectedClassData && loadingSchedule && (
        <div className="my-6 bg-white p-6 rounded-xl shadow-xl">
            <LoadingSpinner text={`Loading schedule for ${selectedClassData.name}...`} />
        </div>
      )}

      {selectedClassData && !loadingSchedule && (
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b pb-4 border-gray-200">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 leading-tight">
                  Schedule: <span className="text-indigo-600">{selectedClassData.name}</span>
                </h2>
                <div className="text-sm text-gray-600 mt-1">
                  <span>Academic Year: <strong>{selectedClassData.academic_year}</strong></span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Shift: <strong>{selectedClassData.shift}</strong></span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>Classroom: <strong>{selectedClassData.classroom || 'N/A'}</strong></span>
                </div>
              </div>
              
              {selectedClassData.academic_year && selectedClassData.academic_year !== 'N/A' && 
               ( (schedule && uniqueTimeSlots.length > 0) || (gradeSubjectsSummary.length > 0) ) && (
                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 items-stretch sm:items-center w-full sm:w-auto">
                  {((uniqueTimeSlots.length > 0) || (gradeSubjectsSummary.length > 0)) && !isDeleting && (
                    <button onClick={handleExportToPDF} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md text-sm flex items-center justify-center transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export PDF
                    </button>
                  )}
                  {schedule && uniqueTimeSlots.length > 0 && !isDeleting && (
                    <button onClick={() => { setIsDeleting(true); setDeleteError(''); setDeleteSuccessMessage(''); }} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md text-sm flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete Schedule
                    </button>
                  )}
                  {schedule && uniqueTimeSlots.length > 0 && isDeleting && (
                    <div className="flex flex-col items-end space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg w-full sm:w-auto">
                        <span className="text-sm text-red-700 font-medium">Confirm deletion of this schedule?</span>
                        <div className="flex items-center space-x-2">
                        <button onClick={handleDeleteSchedule} disabled={deleteInProgress} className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-4 rounded-md text-xs disabled:opacity-50 transition-colors">
                            {deleteInProgress ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button onClick={() => setIsDeleting(false)} disabled={deleteInProgress} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-4 rounded-md text-xs disabled:opacity-50 transition-colors">
                            Cancel
                        </button>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {deleteError && <div className="my-3 p-3 bg-red-100 text-red-700 border border-red-200 rounded-md text-sm">{deleteError}</div>}
            {deleteSuccessMessage && <div className="my-3 p-3 bg-green-100 text-green-700 border border-green-200 rounded-md text-sm">{deleteSuccessMessage}</div>}
            
            {fetchScheduleError && (!schedule || uniqueTimeSlots.length === 0) && !deleteSuccessMessage && (
                <div className="text-center py-6 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="font-medium">Could Not Load Schedule Data:</p>
                    <p className="text-sm">{fetchScheduleError}</p>
                </div>
            )}
            {schedule && uniqueTimeSlots.length === 0 && !fetchScheduleError && !deleteSuccessMessage && (
               <div className="text-center py-6 text-yellow-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="font-medium">No Schedule Data Available</p>
                  <p className="text-sm">There is no schedule data currently entered for this class and academic year.</p>
                </div>
            )}

            {/* Schedule Table */}
            {schedule && uniqueTimeSlots.length > 0 && !deleteSuccessMessage && (
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
            {selectedClassData.grade_id && (
              <div className={`pt-6 mt-6 border-t border-gray-300`}>
                <h3 className="text-lg font-semibold text-blue-700 mb-3">
                  Weekly Subject Hours for Grade {selectedClassData.grade_name || 'Selected Grade'}
                </h3>
                {loadingGradeSubjects && <LoadingSpinner text="Loading subject hours..." />}
                {fetchGradeSubjectsError && !loadingGradeSubjects && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">{fetchGradeSubjectsError}</div>
                )}
                {!loadingGradeSubjects && !fetchGradeSubjectsError && gradeSubjectsSummary.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[350px] w-auto border-separate" style={{ borderSpacing: '0 0.25rem' }}>
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-l-md">Subject</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-r-md">Hours/Week</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {gradeSubjectsSummary.map((subject, index) => (
                            <tr key={subject.subject_id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200 rounded-l-md">{subject.subject_name}</td>
                                <td className="px-4 py-2 text-sm text-blue-600 font-semibold text-right border-b border-gray-200 rounded-r-md">{subject.study_hours} H</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                )}
                {!loadingGradeSubjects && gradeSubjectsSummary.length === 0 && !fetchGradeSubjectsError && (
                  <p className="text-gray-500 py-2 text-sm italic">No subject summary, or study hours are not configured for this grade.</p>
                )}
              </div>
            )}
        </div>
      )}
      
      {!selectedClassData && !loadingClasses && classes.length > 0 && !fetchClassesError && (
           <div className="text-center text-gray-500 py-10 mt-8 bg-white rounded-xl shadow-xl">
            <p className="text-lg font-medium">Please select a class from the list above to view its schedule details.</p>
          </div>
      )}
       {!selectedClassData && !loadingClasses && classes.length === 0 && !fetchClassesError && (
           <div className="text-center text-gray-500 py-10 mt-8 bg-white rounded-xl shadow-xl">
            <p className="text-lg font-medium">Use the filters to search for available classes.</p>
          </div>
      )}
    </div>
  );
};

export default ScheduleList;