import React, { useState } from 'react';
import GradeSubjectsTable from './GradeSubjectsTable';

const GradeCard = ({ grade }) => {
  return (
    <div className="mb-8 border rounded shadow p-4 bg-white">
      <h2 className="text-xl font-semibold mb-2">Grade {grade.name}</h2>
      <GradeSubjectsTable gradeId={grade.id} subjects={grade.subjects} />
    </div>
  );
};

export default GradeCard;
