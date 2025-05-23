import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const GradeList = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/grades');
      // Ensure grade name is numeric and between 7 and 12
      const filtered = response.data.filter(grade => {
        const level = parseInt(grade.name);
        return level >= 7 && level <= 12;
      });
      setGrades(filtered);
    } catch (err) {
      setError('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => setDeleteConfirm(id);
  const cancelDelete = () => setDeleteConfirm(null);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/grades/${id}`);
      setGrades(grades.filter(g => g.id !== id));
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete grade');
    }
  };

  if (loading) return <div className="text-center py-8">Loading grades...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grades (7–12)</h1>
        <Link to="/grades/create" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
          Add Grade
        </Link>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 mb-4 border-l-4 border-red-500">{error}</div>}

      {grades.length === 0 ? (
        <div className="bg-gray-100 rounded p-6 text-center text-gray-600">
          No grades found. Add your first grade to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Grade Level</th>
                <th className="py-2 px-4 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id}>
                  <td className="py-2 px-4 border">Grade {grade.name}</td>
                  <td className="py-2 px-4 border text-center">
                    {deleteConfirm === grade.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleDelete(grade.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <Link
                          to={`/grades/edit/${grade.id}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => confirmDelete(grade.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GradeList;
