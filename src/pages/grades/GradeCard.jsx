import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios'; // For making update requests
import GradeSubjectsTable from './GradeSubjectsTable';

const GradeCard = ({ grade, allSubjects, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [editableSubjects, setEditableSubjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNewSubjectId, setSelectedNewSubjectId] = useState('');

  const totalHours = useMemo(() =>
    grade.subjects.reduce((sum, s) => sum + (s.pivot?.study_hours || 0), 0),
    [grade.subjects]
  );

  // Initialize or reset editableSubjects when editing state changes or grade.subjects changes
  useEffect(() => {
    if (isEditingSubjects) {
      const subjectsToEdit = grade.subjects.map(subject => ({
        ...subject,
        pivot: { ...(subject.pivot || {}), study_hours: subject.pivot?.study_hours || 0 }
      }));
      setEditableSubjects(subjectsToEdit);
    } else {
      // Optionally clear or reset if needed when not editing,
      // but current logic re-initializes on starting edit.
      // setEditableSubjects([]); 
    }
  }, [isEditingSubjects, grade.subjects]);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
    if (expanded && isEditingSubjects) { // If collapsing while editing, cancel edit
      setIsEditingSubjects(false);
      setSelectedNewSubjectId(''); // Reset dropdown selection
    }
  };

  const handleStartEdit = () => {
    setIsEditingSubjects(true);
    // editableSubjects is set by the useEffect above
  };

  const handleCancelEdit = () => {
    setIsEditingSubjects(false);
    setSelectedNewSubjectId(''); // Reset dropdown selection
    // editableSubjects will be reset by useEffect if user clicks edit again
  };

  const handleSubjectHourChange = (subjectId, hours) => {
    setEditableSubjects(prev =>
      prev.map(sub =>
        sub.id === subjectId
          ? { ...sub, pivot: { ...(sub.pivot || {}), study_hours: parseInt(hours, 10) || 0 } }
          : sub
      )
    );
  };

  const availableSubjectsToAdd = useMemo(() => {
    if (!isEditingSubjects || !allSubjects) return [];
    const currentSubjectIds = new Set(editableSubjects.map(s => s.id));
    return allSubjects.filter(s => !currentSubjectIds.has(s.id));
  }, [allSubjects, editableSubjects, isEditingSubjects]);

  const handleAddSubject = () => {
    if (!selectedNewSubjectId) return;

    const subjectToAdd = allSubjects.find(s => s.id.toString() === selectedNewSubjectId);
    if (subjectToAdd) {
      // Check if subject (by ID) is already in editableSubjects to prevent duplicates from rapid clicks
      // (though disabled button and availableSubjectsToAdd should mostly prevent this)
      if (!editableSubjects.find(s => s.id === subjectToAdd.id)) {
        setEditableSubjects(prev => [
          ...prev,
          {
            ...subjectToAdd, // Spread all properties of the subject
            // Ensure pivot exists and study_hours is initialized
            pivot: { study_hours: 0 } 
          }
        ]);
      }
      setSelectedNewSubjectId(''); // Reset dropdown
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updates = editableSubjects.map(s => ({
        subject_id: s.id,
        study_hours: s.pivot.study_hours || 0, // Ensure study_hours is always sent
      }));

      await axios.put(`/grades/${grade.id}/subjects`, { subjects: updates });
      
      onUpdate({ type: 'success', message: 'Subject hours updated successfully!' });
      setIsEditingSubjects(false);
      setSelectedNewSubjectId('');
    } catch (error) {
      console.error('Error updating subject hours:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to update subject hours. Please try again.';
      onUpdate({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Use editableSubjects for the table when editing, otherwise use original grade.subjects
  const subjectsForTable = isEditingSubjects ? editableSubjects : grade.subjects;
  const currentTotalHours = useMemo(() =>
    subjectsForTable.reduce((sum, s) => sum + (s.pivot?.study_hours || 0), 0),
    [subjectsForTable]
  );


  return (
    <div className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-all">
      <div
        onClick={!isEditingSubjects ? handleToggleExpand : undefined} // Only allow toggle if not editing
        className={`px-6 py-4 flex justify-between items-center ${!isEditingSubjects ? 'cursor-pointer' : ''}`}
      >
        <div>
          <h2 className="text-lg font-bold">Grade {grade.name}</h2>
          <p className="text-sm text-gray-600">
            {subjectsForTable.length} Subjects • {currentTotalHours} hrs/week
          </p>
        </div>
        {!isEditingSubjects && (
             <button onClick={handleToggleExpand} className="text-blue-600 hover:underline text-sm focus:outline-none">
                {expanded ? 'Hide Details' : 'Show Details'}
             </button>
        )}
      </div>

      {expanded && (
        <div className="border-t px-6 py-4">
          <GradeSubjectsTable
            subjects={subjectsForTable}
            isEditing={isEditingSubjects}
            onSubjectHourChange={handleSubjectHourChange}
            // allSubjects prop is not directly used by GradeSubjectsTable in the provided code
            // but keeping it if it was intended for other uses or future expansion there.
            // allSubjects={allSubjects} 
          />

          {isEditingSubjects && (
            <>
              {allSubjects && allSubjects.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Add Subject to Grade</h4>
                  {availableSubjectsToAdd.length > 0 ? (
                    <div className="flex items-center space-x-3">
                      <select
                        value={selectedNewSubjectId}
                        onChange={(e) => setSelectedNewSubjectId(e.target.value)}
                        className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isSaving}
                      >
                        <option value="">-- Select Subject --</option>
                        {availableSubjectsToAdd.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        disabled={!selectedNewSubjectId || isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add to List
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      All available subjects have been added to this grade's list no more subjects are available.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving || editableSubjects.length === 0} // Also disable if no subjects to save
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {!isEditingSubjects && (
            <div className="mt-4 flex justify-end">
                {/* Show Edit button only if there are subjects or if there are subjects to add */}
                {(grade.subjects.length > 0 || (allSubjects && allSubjects.length > 0)) && (
                     <button
                        onClick={handleStartEdit}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        {grade.subjects.length > 0 ? 'Edit Subject Hours' : 'Assign Subjects'}
                    </button>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradeCard;