import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    grade_id: '',
    default_hours: 0,
    description: ''
  });

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSubject = async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/subjects/${id}`);
        setFormData(response.data);
      } catch (err) {
        setError('Failed to fetch subject data');
      } finally {
        setLoading(false);
      }
    };

    const fetchGrades = async () => {
      try {
        const res = await axios.get('/grades'); // Replace with your actual endpoint
        setGrades(res.data);
      } catch (err) {
        console.error('Failed to fetch grades', err);
      }
    };

    fetchSubject();
    fetchGrades();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: parseInt(value) || 0
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Subject name is required');
      return false;
    }

    if (!formData.code.trim()) {
      setError('Subject code is required');
      return false;
    }

    if (!formData.grade_id) {
      setError('Please select a grade');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing) {
        await axios.put(`/subjects/${id}`, formData);
        setSuccess('Subject updated successfully!');
      } else {
        await axios.post('/subjects', formData);
        setSuccess('Subject created successfully!');
        setFormData({
          name: '',
          code: '',
          grade_id: '',
          default_hours: 0,
          description: ''
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save subject data';
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
          {isEditing ? 'Edit Subject' : 'Add New Subject'}
        </h1>
        <button
          onClick={() => navigate('/subjects')}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          Back to Subjects
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Code*
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 mb-1">
                Grade*
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
                <option value="">Select a grade</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="default_hours" className="block text-sm font-medium text-gray-700 mb-1">
                Default Hours per Week
              </label>
              <input
                type="number"
                id="default_hours"
                name="default_hours"
                min="0"
                max="20"
                value={formData.default_hours}
                onChange={handleNumberChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
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
                'Save Subject'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectForm;
