import React from 'react';

const GradeSubjectsTable = ({ subjects, isEditing, onSubjectHourChange }) => {
  if (!subjects || subjects.length === 0) {
    return <p className="text-sm text-gray-500">No subjects assigned to this grade.</p>;
  }

  const handleHoursChange = (subjectId, value) => {
    const hours = parseInt(value, 10);
    if (!isNaN(hours) && hours >= 0) {
      onSubjectHourChange(subjectId, hours);
    } else if (value === "") { // Allow clearing the input
      onSubjectHourChange(subjectId, 0);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Subject Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Study Hours/Week
            </th>
            {/* Add more headers if needed, e.g., for actions, but actions are now outside */}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {subjects.map((subject) => (
            <tr key={subject.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {subject.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={subject.pivot?.study_hours || 0}
                    onChange={(e) => handleHoursChange(subject.id, e.target.value)}
                    className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                ) : (
                  subject.pivot?.study_hours || 0
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GradeSubjectsTable;