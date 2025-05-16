import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SubjectList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subjects');
      setSubjects(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch subjects');
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
      await axios.delete(`/api/subjects/${id}`);
      setSubjects(subjects.filter(subject => subject.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading subjects...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <Link 
          to="/subjects/create" 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Add New Subject
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-600">No subjects found. Add your first subject to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Name</th>
                <th className="py-2 px-4 border text-left">Code</th>
                <th className="py-2 px-4 border text-left">Default Hours</th>
                <th className="py-2 px-4 border text-left">Description</th>
                <th className="py-2 px-4 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => (
                <tr key={subject.id}>
                  <td className="py-2 px-4 border">{subject.name}</td>
                  <td className="py-2 px-4 border">{subject.code}</td>
                  <td className="py-2 px-4 border">{subject.default_hours || 0} hr/week</td>
                  <td className="py-2 px-4 border">{subject.description || 'N/A'}</td>
                  <td className="py-2 px-4 border text-center">
                    {deleteConfirm === subject.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleDelete(subject.id)}
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
                          to={`/subjects/edit/${subject.id}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => confirmDelete(subject.id)}
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

export default SubjectList;