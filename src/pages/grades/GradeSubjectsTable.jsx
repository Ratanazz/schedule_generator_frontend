import React, { useState } from 'react';
import axios from 'axios';

const GradeSubjectsTable = ({ gradeId, subjects }) => {
  const [subjectList, setSubjectList] = useState(subjects);

  const handleStudyHourChange = async (subjectId, hours) => {
    try {
      const updated = subjectList.map(s => s.id === subjectId ? { ...s, pivot: { ...s.pivot, study_hours: hours } } : s);
      setSubjectList(updated);
      await axios.put(`/grades/${gradeId}/subjects/${subjectId}`, { study_hours: hours });
    } catch {
      alert('Failed to update study hours');
    }
  };

  const handleRemove = async (subjectId) => {
    try {
      await axios.delete(`/grades/${gradeId}/subjects/${subjectId}`);
      setSubjectList(subjectList.filter(s => s.id !== subjectId));
    } catch {
      alert('Failed to remove subject');
    }
  };

  return (
    <table className="w-full border mt-2">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border">Subject</th>
          <th className="p-2 border">Study Hours</th>
          <th className="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {subjectList.map(sub => (
          <tr key={sub.id}>
            <td className="p-2 border">{sub.name}</td>
            <td className="p-2 border">
              <input
                type="number"
                value={sub.pivot.study_hours}
                onChange={(e) => handleStudyHourChange(sub.id, parseInt(e.target.value))}
                className="w-20 px-2 py-1 border rounded"
              />
            </td>
            <td className="p-2 border">
              <button onClick={() => handleRemove(sub.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded">Remove</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default GradeSubjectsTable;
