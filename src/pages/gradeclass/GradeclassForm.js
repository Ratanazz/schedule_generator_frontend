import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GradeclassForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    grade_id: '',
    section: '',
    classroom: '',
    student_count: 0,
    academic_year: new Date().getFullYear(),
    shift: '',
    notes: ''
  });

  const [gradeLevels, setGradeLevels] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await axios.get('/grades');
        setGradeLevels(response.data);
      } catch (err) {
        console.error('Failed to fetch grade levels', err);
      }
    };
    fetchGrades();
  }, []);

  useEffect(() => {
    const fetchGrade = async () => {
      if (!isEditing) return;

      try {
        const response = await axios.get(`/gradeclasses/${id}`);
        setFormData(response.data);
      } catch (err) {
        setError('Failed to fetch class data');
      } finally {
        setLoading(false);
      }
    };
    fetchGrade();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: parseInt(value) || 0
    }));
  };

  const validateForm = () => {
    if (!formData.section.trim()) {
      setError('Section name is required');
      return false;
    }

    if (!formData.grade_id) {
      setError('Grade level is required');
      return false;
    }

    if (!formData.shift) {
      setError('Shift is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing) {
        await axios.put(`/gradeclasses/${id}`, formData);
        setSuccess('Class updated successfully!');
      } else {
        await axios.post('/gradeclasses', formData);
        setSuccess('Class created successfully!');
        setFormData({
          grade_id: '',
          section: '',
          classroom: '',
          student_count: 0,
          academic_year: new Date().getFullYear(),
          shift: '',
          notes: ''
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save class data';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Class' : 'Add New Class'}
        </h1>
        <button
          onClick={() => navigate('/classes')}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          Back to Classes
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level*
              </label>
              <select
                id="grade_id"
                name="grade_id"
                value={formData.grade_id}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                required
                disabled={submitting}
              >
                <option value="">Select Grade</option>
                {gradeLevels.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                Section Name*
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                placeholder="e.g. A, B, Science, etc."
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-1">
                Classroom
              </label>
              <input
                type="text"
                id="classroom"
                name="classroom"
                value={formData.classroom}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                placeholder="e.g. Room 101"
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
                Shift*
              </label>
              <select
                id="shift"
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                required
                disabled={submitting}
              >
                <option value="">Select Shift</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
              </select>
            </div>

            <div>
              <label htmlFor="student_count" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Students
              </label>
              <input
                type="number"
                id="student_count"
                name="student_count"
                min="0"
                max="100"
                value={formData.student_count}
                onChange={handleNumberChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <input
                type="number"
                id="academic_year"
                name="academic_year"
                min="2000"
                max="2100"
                value={formData.academic_year}
                onChange={handleNumberChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                disabled={submitting}
              />
            </div>

            
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 w-full"
              disabled={submitting}
            ></textarea>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Class'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeclassForm;
