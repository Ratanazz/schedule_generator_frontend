import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GradeclassList = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/grades');
      // Filter grades to only include 7-12
      const filteredGrades = response.data.filter(grade => 
        grade.level >= 7 && grade.level <= 12
      );
      setGrades(filteredGrades);
      setError('');
    } catch (err) {
      setError('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/grades/${id}`);
      setGrades(grades.filter(grade => grade.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete grade');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading classes...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes (7-12)</h1>
        <Link 
          to="/grades/create" 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Add New Class
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {grades.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-600">No grades found. Add your first grade to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Grade Level</th>
                <th className="py-2 px-4 border text-left">Section</th>
                <th className="py-2 px-4 border text-left">Classroom</th>
                <th className="py-2 px-4 border text-left"># of Students</th>
                <th className="py-2 px-4 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(grade => (
                <tr key={grade.id}>
                  <td className="py-2 px-4 border">Grade {grade.level}</td>
                  <td className="py-2 px-4 border">{grade.section}</td>
                  <td className="py-2 px-4 border">{grade.classroom || 'N/A'}</td>
                  <td className="py-2 px-4 border">{grade.student_count || 0}</td>
                  <td className="py-2 px-4 border text-center">
                    {deleteConfirm === grade.id ? (
                      <div className="flex items-center justify-center space-x-2">
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
                      <div className="flex items-center justify-center space-x-2">
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

export default GradeclassList;