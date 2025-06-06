import React, { useState, useMemo } from 'react';
import GradeSubjectsTable from './GradeSubjectsTable';

const GradeCard = ({ grade, allSubjects, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const totalHours = useMemo(() => 
    grade.subjects.reduce((sum, s) => sum + (s.pivot?.study_hours || 0), 0),
    [grade.subjects]
  );

  return (
    <div 
      className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-all"
    >
      <div 
        onClick={() => setExpanded(!expanded)} 
        className="cursor-pointer px-6 py-4 flex justify-between items-center"
      >
        <div>
          <h2 className="text-lg font-bold">Grade {grade.name}</h2>
          <p className="text-sm text-gray-600">
            {grade.subjects.length} Subjects • {totalHours} hrs/week
          </p>
        </div>
        <button className="text-blue-600 hover:underline text-sm">
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {expanded && (
        <div className="border-t px-6 py-4">
          <GradeSubjectsTable 
            grade={grade} 
            allSubjects={allSubjects} 
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default GradeCard;
