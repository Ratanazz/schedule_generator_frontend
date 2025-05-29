import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const GradeList = () => {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [assignForms, setAssignForms] = useState({});

  useEffect(() => {
    fetchGrades();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/subjects');
      setSubjects(res.data);
    } catch {
      setError('Failed to fetch subjects');
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/grades');
      const filtered = res.data.filter(g => {
        const level = parseInt(g.name);
        return level >= 7 && level <= 12;
      });

      const gradesWithSubjects = await Promise.all(
        filtered.map(async (grade) => {
          try {
            const subsRes = await axios.get(`/grades/${grade.id}/subjects`);
            return { ...grade, subjects: subsRes.data };
          } catch {
            return { ...grade, subjects: [] };
          }
        })
      );

      setGrades(gradesWithSubjects);
    } catch {
      setError('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignChange = (gradeId, field, value) => {
    setAssignForms(prev => ({
      ...prev,
      [gradeId]: {
        ...prev[gradeId],
        [field]: value,
      },
    }));
  };

  const handleAssignSubject = async (gradeId) => {
    const form = assignForms[gradeId];
    if (!form || !form.subject_id) return;

    try {
      await axios.post('/grade-subjects', {
        grade_id: gradeId,
        subject_id: form.subject_id,
        study_hours: form.study_hours || 0,
      });
      fetchGrades(); // refresh list
      setAssignForms(prev => ({ ...prev, [gradeId]: {} })); // reset form
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning subject');
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

      {grades.map((grade) => (
        <div key={grade.id} className="mb-6 border rounded p-4 bg-white shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Grade {grade.name}</h2>
            {deleteConfirm === grade.id ? (
              <div className="space-x-2">
                <button onClick={() => handleDelete(grade.id)} className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs">Confirm</button>
                <button onClick={cancelDelete} className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs">Cancel</button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link to={`/grades/edit/${grade.id}`} className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs">Edit</Link>
                <button onClick={() => confirmDelete(grade.id)} className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs">Delete</button>
              </div>
            )}
          </div>

          {/* Subject List */}
          {grade.subjects && grade.subjects.length > 0 ? (
            <ul className="list-disc list-inside ml-4 mb-2">
              {grade.subjects.map((subject) => (
                <li key={subject.id}>
                  {subject.name}
                  {subject.pivot?.study_hours != null && (
                    <span className="text-sm text-gray-500 ml-2">(study: {subject.pivot.study_hours} hrs)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 ml-4 mb-2">No subjects assigned.</p>
          )}

          {/* Assign Subject Form */}
          <div className="flex items-center space-x-2 mt-2">
            <select
              value={assignForms[grade.id]?.subject_id || ''}
              onChange={(e) => handleAssignChange(grade.id, 'subject_id', e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              max="40"
              placeholder="study Hours"
              value={assignForms[grade.id]?.study_hours || ''}
              onChange={(e) => handleAssignChange(grade.id, 'study_hours', e.target.value)}
              className="border rounded px-2 py-1 w-28"
            />
            <button
              onClick={() => handleAssignSubject(grade.id)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Assign
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GradeList;
