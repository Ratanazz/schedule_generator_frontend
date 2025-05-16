import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const ScheduleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    grade: 7,
    subjects: [{ name: '', hours_per_week: 0 }],
    teachers: []
  });
  
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  
  const grades = [7, 8, 9, 10, 11, 12];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '7:30 - 8:20', '8:25 - 9:15', '9:20 - 10:10', '10:15 - 11:05', 
    '11:10 - 12:00', '1:00 - 1:50', '1:55 - 2:45', '2:50 - 3:40'
  ];

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/api/teachers');
        setAvailableTeachers(response.data);
      } catch (err) {
        setError('Failed to fetch teachers. Please try again later.');
      }
    };

    fetchTeachers();

    if (isEditing) {
      fetchSchedule();
    }
  }, [id, isEditing]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/schedules/${id}`);
      const schedule = response.data;
      
      setFormData({
        grade: schedule.grade,
        subjects: schedule.subjects || [{ name: '', hours_per_week: 0 }],
        teachers: schedule.teachers || []
      });
      
      if (schedule.selected_teachers) {
        setSelectedTeachers(schedule.selected_teachers);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch schedule. Please try again later.');
      setLoading(false);
    }
  };

  const handleGradeChange = (e) => {
    setFormData({ ...formData, grade: parseInt(e.target.value) });
  };

  const handleAddSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { name: '', hours_per_week: 0 }]
    });
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index][field] = field === 'hours_per_week' ? parseInt(value) : value;
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const handleRemoveSubject = (index) => {
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const handleTeacherSelection = (teacher) => {
    const isSelected = selectedTeachers.some(t => t.id === teacher.id);
    
    if (isSelected) {
      setSelectedTeachers(selectedTeachers.filter(t => t.id !== teacher.id));
    } else {
      setSelectedTeachers([...selectedTeachers, teacher]);
    }
  };

  const generateSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate form data
      if (formData.subjects.some(subject => !subject.name || subject.hours_per_week <= 0)) {
        setError('Please fill out all subject fields with valid hours per week.');
        setLoading(false);
        return;
      }
      
      if (selectedTeachers.length === 0) {
        setError('Please select at least one teacher.');
        setLoading(false);
        return;
      }

      const scheduleData = {
        grade: formData.grade,
        subjects: formData.subjects,
        teachers: selectedTeachers.map(teacher => teacher.id)
      };

      let response;
      if (isEditing) {
        response = await axios.put(`/api/schedules/${id}`, scheduleData);
      } else {
        response = await axios.post('/api/schedules', scheduleData);
      }

      navigate(`/schedules/${response.data.id}`);
    } catch (err) {
      setError('Failed to generate schedule. Please check your inputs and try again.');
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="text-center py-8">Loading schedule data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Schedule' : 'Create New Schedule'}</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Grade
          </label>
          <select
            value={formData.grade}
            onChange={handleGradeChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {grades.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Subjects</h2>
            <button
              type="button"
              onClick={handleAddSubject}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              + Add Subject
            </button>
          </div>

          {formData.subjects.map((subject, index) => (
            <div key={index} className="flex flex-wrap mb-4 p-4 border rounded bg-gray-50">
              <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div className="w-full md:w-1/3 px-3">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Hours Per Week
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={subject.hours_per_week}
                  onChange={(e) => handleSubjectChange(index, 'hours_per_week', e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="w-full md:w-1/6 px-3 flex items-end">
                {formData.subjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(index)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Teachers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTeachers.map(teacher => (
              <div 
                key={teacher.id} 
                className={`border p-4 rounded cursor-pointer ${
                  selectedTeachers.some(t => t.id === teacher.id) 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-white'
                }`}
                onClick={() => handleTeacherSelection(teacher)}
              >
                <h3 className="font-bold">{teacher.name}</h3>
                <p className="text-sm">Shift: {teacher.shift}</p>
                <p className="text-sm">Subjects: {teacher.subjects.join(', ')}</p>
              </div>
            ))}
          </div>
          {availableTeachers.length === 0 && (
            <p className="text-gray-500 italic">No teachers available. Please add teachers first.</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={generateSchedule}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Processing...' : isEditing ? 'Update Schedule' : 'Generate Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;