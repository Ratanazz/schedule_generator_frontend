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
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const navigate = useNavigate();

  const academicYears = Array.from({ length: 7 }, (_, i) => `${2024 + i}`);

  const fetchAllUserClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const res = await axios.get('/gradeclasses');
      const fetchedClasses = res.data || [];

      // Filter out classes that already have a schedule
      const unscheduledClasses = fetchedClasses.filter(cls => !cls.has_schedule);

      setAllClasses(unscheduledClasses);
      setFilteredClasses(unscheduledClasses);

      const uniqueGrades = [...new Set(unscheduledClasses.map(cls => cls.grade?.name).filter(Boolean))];
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
    let currentClasses = [...allClasses];
    if (selectedGrade) {
      currentClasses = currentClasses.filter(cls => cls.grade?.name === selectedGrade);
    }
    setFilteredClasses(currentClasses);
    setSelectAll(false);
  }, [selectedGrade, allClasses]);

  const handleClassSelection = (classId) => {
    setSelectedClassIds(prev => {
      const newSelected = new Set(prev);
      newSelected.has(classId) ? newSelected.delete(classId) : newSelected.add(classId);
      return newSelected;
    });
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setSelectedClassIds(newState ? new Set(filteredClasses.map(cls => cls.id)) : new Set());
  };

  useEffect(() => {
    if (filteredClasses.length > 0 && selectedClassIds.size === filteredClasses.length) {
      const allSelected = filteredClasses.every(cls => selectedClassIds.has(cls.id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedClassIds, filteredClasses]);

  const handleGenerateSchedules = async () => {
    if (!academicYear) {
      setGenerationMessage('Error: Please select an Academic Year.');
      return;
    }
    if (selectedClassIds.size === 0) {
      setGenerationMessage('Error: Please select at least one class.');
      return;
    }

    setIsGenerating(true);
    setGenerationMessage('Generating schedules... Please wait.');
    try {
      const res = await axios.post('/schedules/generate', {
        academic_year: academicYear,
        class_ids: Array.from(selectedClassIds)
      });
      setGenerationMessage(res.data.message || 'Schedules generated successfully.');
    } catch (error) {
      setGenerationMessage(error.response?.data?.message || 'Error: Failed to generate schedules.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Class Schedule Generation</h1>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="border p-3 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="border p-3 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Grades</option>
              {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateSchedules}
          disabled={isGenerating || loadingClasses || !academicYear || selectedClassIds.size === 0}
          className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-base font-semibold"
        >
          {isGenerating ? 'Generating...' : 'Generate Schedules'}
        </button>

        {generationMessage && (
          <p className={`mt-3 text-sm ${generationMessage.includes('Error') ? 'text-red-600' : 'text-green-700'}`}>
            {generationMessage}
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blue-800">Available Classes</h2>
          {filteredClasses.length > 0 && (
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="form-checkbox h-4 w-4 text-blue-600 border-gray-300"
              />
              <span>Select All ({filteredClasses.length})</span>
            </label>
          )}
        </div>

        {loadingClasses ? (
          <p>Loading class list...</p>
        ) : filteredClasses.length === 0 ? (
          <p className="text-gray-500">No unscheduled classes available or matching your filters.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredClasses.map(cls => (
              <div
                key={cls.id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-blue-50 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {cls.grade?.name || 'N/A'} {cls.section}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Shift: {cls.shift || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Class ID: {cls.id}</p>
                </div>
                <div className="mt-3 text-right">
                  <input
                    type="checkbox"
                    checked={selectedClassIds.has(cls.id)}
                    onChange={() => handleClassSelection(cls.id)}
                    className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGenerationSetup;
