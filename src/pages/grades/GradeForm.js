import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GradeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '7' // Store as string to satisfy Laravel string validation
  });

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, "12 Science","12 Social"];

  useEffect(() => {
    const fetchGrade = async () => {
      if (!isEditing) return;

      try {
        const response = await axios.get(`/grades/${id}`);
        setFormData({ name: String(response.data.name) }); // Ensure it's a string
      } catch (err) {
        setError('Failed to fetch grade');
      } finally {
        setLoading(false);
      }
    };

    fetchGrade();
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFormData({ name: e.target.value }); // Keep as string
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const gradeNumber = parseInt(formData.name);
    if (gradeNumber < 1 || gradeNumber > 12) {
      setError('Grade level must be between 1 and 12');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing) {
        await axios.put(`/grades/${id}`, formData);
        setSuccess('Grade updated successfully!');
      } else {
        await axios.post('/grades', formData);
        setSuccess('Grade created successfully!');
        setFormData({ name: '7' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save grade';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Grade' : 'Add Grade'}</h1>
        <button
          onClick={() => navigate('/grades')}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          Back to Grades
        </button>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">{success}</div>}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level*
            </label>
            <select
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 w-full"
              required
              disabled={submitting}
            >
              {gradeLevels.map(level => (
                <option key={level} value={String(level)}>
                  Grade {level}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded"
            >
              {submitting ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeForm;
