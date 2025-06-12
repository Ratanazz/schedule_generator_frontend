import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ScheduleGenerationSetup = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [allClasses, setAllClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState(new Set());
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  // const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = useState(''); // For filtering class list

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const navigate = useNavigate();

  const fetchAllUserClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const res = await axios.get('/gradeclasses'); // Endpoint to get all classes for the user
      const fetchedClasses = res.data || [];
      setAllClasses(fetchedClasses);
      setFilteredClasses(fetchedClasses); // Initially show all

      // Extract unique grades for filter dropdown
      const uniqueGrades = [...new Set(fetchedClasses.map(cls => cls.grade?.name).filter(Boolean))];
      setGrades(uniqueGrades.sort());

    } catch (error) {
      console.error("Error fetching classes:", error);
      setGenerationMessage("Error: Could not load class list.");
    }
    setLoadingClasses(false);
  }, []);

  useEffect(() => {
    fetchAllUserClasses();
  }, [fetchAllUserClasses]);

  useEffect(() => {
    // Apply filters when selectedGrade changes
    let currentClasses = [...allClasses];
    if (selectedGrade) {
      currentClasses = currentClasses.filter(cls => cls.grade?.name === selectedGrade);
    }
    // Add more filters if needed (e.g., by academic year if classes have it reliably)
    setFilteredClasses(currentClasses);
    // Reset selectAll when filters change, as the displayed list changes
    setSelectAll(false); 
    // Option: could also try to maintain selection based on IDs if desired, but simpler to reset
  }, [selectedGrade, allClasses]);


  const handleClassSelection = (classId) => {
    setSelectedClassIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(classId)) {
        newSelected.delete(classId);
      } else {
        newSelected.add(classId);
      }
      return newSelected;
    });
    setSelectAll(false); // If individual item is unchecked, "Select All" should be false
  };

  const handleSelectAll = () => {
    const newSelectAllState = !selectAll;
    setSelectAll(newSelectAllState);
    if (newSelectAllState) {
      // Select all *currently filtered* classes
      const allFilteredIds = new Set(filteredClasses.map(cls => cls.id));
      setSelectedClassIds(allFilteredIds);
    } else {
      setSelectedClassIds(new Set());
    }
  };
  
  // Update selectAll checkbox if all filtered items are manually selected/deselected
  useEffect(() => {
    if (filteredClasses.length > 0 && selectedClassIds.size === filteredClasses.length) {
        // Check if all filtered classes IDs are in selectedClassIds
        const allFilteredSelected = filteredClasses.every(cls => selectedClassIds.has(cls.id));
        if (allFilteredSelected) {
            setSelectAll(true);
        } else {
            setSelectAll(false); // If some filtered items are not selected
        }
    } else if (filteredClasses.length === 0 || selectedClassIds.size === 0) {
        setSelectAll(false);
    }
  }, [selectedClassIds, filteredClasses]);


  const handleGenerateSchedules = async () => {
    if (!academicYear.trim()) {
      setGenerationMessage('Error: Please enter the Academic Year for generation.');
      return;
    }
    if (selectedClassIds.size === 0) {
      setGenerationMessage('Error: Please select at least one class to generate schedules for.');
      return;
    }

    setIsGenerating(true);
    setGenerationMessage('Generating schedules... Please wait.');
    try {
      const res = await axios.post('/schedules/generate', {
        academic_year: academicYear,
        class_ids: Array.from(selectedClassIds) // Convert Set to Array for API
      });
      setGenerationMessage(res.data.message || 'Schedules generation process initiated.');
      // Optionally, clear selections or navigate away after success
      // setSelectedClassIds(new Set());
      // setSelectAll(false);
      // setTimeout(() => navigate('/schedules'), 3000); // Navigate back after 3s
    } catch (error) {
      console.error("Error generating schedules:", error);
      setGenerationMessage(error.response?.data?.message || 'Error: Failed to generate schedules.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Generate Schedules for Classes</h1>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="mb-4">
          <label htmlFor="academicYearGenerate" className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year for Schedule Generation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="academicYearGenerate"
            placeholder="e.g., 2024-2025"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="border p-3 rounded-md w-full sm:w-72 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          onClick={handleGenerateSchedules}
          disabled={isGenerating || loadingClasses || !academicYear.trim() || selectedClassIds.size === 0}
          className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto text-base font-semibold"
        >
          {isGenerating ? 'Generating...' : 'Generate for Selected Classes'}
        </button>
        {generationMessage && (
          <p className={`mt-3 text-sm ${generationMessage.includes('Error:') ? 'text-red-600' : 'text-green-700'}`}>
            {generationMessage}
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Select Classes</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
          <div className="w-full sm:w-1/2">
            <label htmlFor="gradeFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Grade:</label>
            <select
              id="gradeFilter"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="border p-3 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Grades</option>
              {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
            </select>
          </div>
          {/* Add more filters here if needed, e.g., filter by existing academic year */}
        </div>

        {loadingClasses ? (
          <p>Loading class list...</p>
        ) : (
          <>
            {filteredClasses.length > 0 && (
                <div className="mb-3 border-b pb-2">
                    <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        disabled={filteredClasses.length === 0}
                    />
                    <span>Select All ({filteredClasses.length} shown)</span>
                    </label>
                </div>
            )}
            {filteredClasses.length === 0 && !loadingClasses && <p className="text-gray-600 py-3">No classes match your filters or no classes available.</p>}
            
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {filteredClasses.map(cls => (
                <div key={cls.id} className="p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-800">{cls.grade?.name || 'N/A'} {cls.section || ''}</span>
                    <span className="text-xs text-gray-500 ml-2">(Shift: {cls.shift || 'N/A'})</span>
                  </div>
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    checked={selectedClassIds.has(cls.id)}
                    onChange={() => handleClassSelection(cls.id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleGenerationSetup;