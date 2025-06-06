import React, { useState } from 'react';
import axios from 'axios';

const GradeSubjectsTable = ({ grade, allSubjects, onUpdate }) => {
  const [subjects, setSubjects] = useState(grade.subjects);

  const updateStudyHour = async (subjectId, hours) => {
    try {
      await axios.put(`/grades/${grade.id}/subjects/${subjectId}`, { study_hours: hours });
      onUpdate(); // Refresh from parent
    } catch {
      alert('Failed to update');
    }
  };

  const removeSubject = async (subjectId) => {
    try {
      await axios.delete(`/grades/${grade.id}/subjects/${subjectId}`);
      onUpdate();
    } catch {
      alert('Failed to remove');
    }
  };

  const addSubject = async (subjectId) => {
    try {
      await axios.post(`/grades/${grade.id}/subjects`, { subject_id: subjectId });
      onUpdate();
    } catch {
      alert('Failed to add');
    }
  };

  const availableSubjects = allSubjects.filter(s => !subjects.some(g => g.id === s.id));

  return (
    <div className="space-y-4">
      <table className="w-full table-auto text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">Subject</th>
            <th className="p-2">Hours</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map(subject => (
            <tr key={subject.id} className="border-b">
              <td className="p-2">{subject.name}</td>
              <td className="p-2">
                <input
                  type="number"
                  className="w-20 border rounded px-2 py-1"
                  defaultValue={subject.pivot?.study_hours || 0}
                  onBlur={(e) => updateStudyHour(subject.id, parseInt(e.target.value))}
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() => removeSubject(subject.id)}
                  className="text-red-500 hover:underline text-xs"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {availableSubjects.length > 0 && (
        <div>
          <select
            defaultValue=""
            onChange={(e) => {
              const id = parseInt(e.target.value);
              if (!isNaN(id)) addSubject(id);
              e.target.value = '';
            }}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Add Subject...</option>
            {availableSubjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default GradeSubjectsTable;
