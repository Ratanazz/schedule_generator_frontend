import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const GradeList = () => {
  const [grades, setGrades] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // editingGradeId for study_hours editing: number | null
  // editingSubjectsGradeId for subject add/remove editing: number | null
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [editingSubjectsGradeId, setEditingSubjectsGradeId] = useState(null);

  // store edited study hours { [gradeId]: { [subjectId]: number|string } }
  const [editedStudyHours, setEditedStudyHours] = useState({});

  useEffect(() => {
    fetchAllSubjects();
    fetchGrades();
  }, []);

  const fetchAllSubjects = async () => {
    try {
      const res = await axios.get('/subjects');
      setAllSubjects(res.data);
    } catch {
      setError('Failed to fetch all subjects');
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
          const subsRes = await axios.get(`/grades/${grade.id}/subjects`);
          return { ...grade, subjects: subsRes.data };
        })
      );

      setGrades(gradesWithSubjects);
    } catch (err) {
      setError('Failed to fetch grades or subjects');
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

  const handleStudyHourChange = (gradeId, subjectId, value) => {
    setEditedStudyHours(prev => ({
      ...prev,
      [gradeId]: {
        ...prev[gradeId],
        [subjectId]: value,
      }
    }));
  };

  const updateStudyHour = async (gradeId, subjectId, value) => {
    try {
      const intValue = parseInt(value);
      if (isNaN(intValue) || intValue < 0) {
        setError('Study hours must be a non-negative number');
        return;
      }

      await axios.put(`/grades/${gradeId}/subjects/${subjectId}`, {
        study_hours: intValue,
      });
      await fetchGrades();
      // Reset edited input after update
      setEditedStudyHours(prev => {
        const copy = { ...prev };
        if (copy[gradeId]) {
          delete copy[gradeId][subjectId];
          if (Object.keys(copy[gradeId]).length === 0) {
            delete copy[gradeId];
          }
        }
        return copy;
      });
    } catch {
      setError('Failed to update study hours');
    }
  };

  const addSubjectToGrade = async (gradeId, subjectId) => {
    try {
      await axios.post(`/grades/${gradeId}/subjects`, { subject_id: subjectId });
      await fetchGrades();
    } catch {
      setError('Failed to add subject to grade');
    }
  };

  const removeSubjectFromGrade = async (gradeId, subjectId) => {
    try {
      await axios.delete(`/grades/${gradeId}/subjects/${subjectId}`);
      await fetchGrades();
    } catch {
      setError('Failed to remove subject from grade');
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
        <div className="space-y-6">
          {grades.map((grade) => (
            <div key={grade.id} className="border rounded shadow p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Grade {grade.name}</h2>
                <div className="space-x-2 flex items-center">
                  {deleteConfirm === grade.id ? (
                    <>
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
                    </>
                  ) : (
                    <>
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

                      <button
                        onClick={() =>
                          setEditingGradeId(editingGradeId === grade.id ? null : grade.id)
                        }
                        className={`${
                          editingGradeId === grade.id ? 'bg-yellow-600' : 'bg-yellow-500'
                        } hover:bg-yellow-600 text-white py-1 px-2 rounded text-xs`}
                      >
                        {editingGradeId === grade.id ? 'Close Hours Edit' : 'Edit Study Hours'}
                      </button>

                      <button
                        onClick={() =>
                          setEditingSubjectsGradeId(
                            editingSubjectsGradeId === grade.id ? null : grade.id
                          )
                        }
                        className={`${
                          editingSubjectsGradeId === grade.id ? 'bg-green-600' : 'bg-green-500'
                        } hover:bg-green-600 text-white py-1 px-2 rounded text-xs`}
                      >
                        {editingSubjectsGradeId === grade.id ? 'Close Subject Edit' : 'Edit Subjects'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {grade.subjects.length === 0 ? (
                <div className="text-gray-500">No subjects assigned.</div>
              ) : (
                <ul className="space-y-2">
                  {grade.subjects.map((subject) => (
                    <li key={subject.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <span className="font-medium">{subject.name}</span>{' '}
                        <span className="text-sm text-gray-600">
                          ({subject.pivot?.study_hours ?? 'N/A'} hours/week)
                        </span>
                      </div>

                      {/* Edit Study Hours input */}
                      {editingGradeId === grade.id && (
                        <input
                          type="number"
                          min={0}
                          className="border rounded px-2 py-1 w-20 text-sm"
                          value={
                            editedStudyHours?.[grade.id]?.[subject.id] ??
                            subject.pivot?.study_hours ?? ''
                          }
                          onChange={(e) =>
                            handleStudyHourChange(grade.id, subject.id, e.target.value)
                          }
                          onBlur={(e) =>
                            updateStudyHour(grade.id, subject.id, e.target.value)
                          }
                        />
                      )}

                      {/* Edit Subjects remove button */}
                      {editingSubjectsGradeId === grade.id && (
                        <button
                          onClick={() => removeSubjectFromGrade(grade.id, subject.id)}
                          className="text-red-500 text-xs hover:underline ml-2"
                          title="Remove Subject"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Add Subject Dropdown */}
              {editingSubjectsGradeId === grade.id && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Add Subject:</h4>
                  <select
                    onChange={(e) => {
                      const subjectId = parseInt(e.target.value);
                      if (!isNaN(subjectId)) addSubjectToGrade(grade.id, subjectId);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="">-- Select Subject --</option>
                    {allSubjects
                      .filter((s) => !grade.subjects.some(g => g.id === s.id))
                      .map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradeList;
