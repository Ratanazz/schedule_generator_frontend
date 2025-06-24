import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import GradeCard from './GradeCard';
import { Link } from 'react-router-dom';

const GradeList = () => {
  const [grades, setGrades] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionFeedback, setActionFeedback] = useState({ message: '', type: '' });
  const ACTION_FEEDBACK_TIMEOUT = 5000;

  useEffect(() => {
    let timer;
    if (actionFeedback.message) {
      timer = setTimeout(() => {
        setActionFeedback({ message: '', type: '' });
      }, ACTION_FEEDBACK_TIMEOUT);
    }
    return () => clearTimeout(timer);
  }, [actionFeedback.message]);

  const fetchData = useCallback(async (showMainSpinner = true) => {
    if (showMainSpinner) {
      setLoading(true);
    }
    try {
      const subjectRes = await axios.get('/subjects');
      const gradeRes = await axios.get('/grades');

      const gradesInRange = (gradeRes.data || []).filter(g => {
        const level = parseInt(g.name);
        return !isNaN(level) && level >= 7 && level <= 12;
      });

      const enrichedGradesPromises = gradesInRange.map(async (g) => {
        try {
          const res = await axios.get(`/grades/${g.id}/subjects`);
          return { ...g, subjects: res.data || [] };
        } catch (subjectError) {
          console.error(`Error fetching subjects for grade ${g.id} (${g.name}):`, subjectError);
          return { ...g, subjects: [], errorFetchingSubjects: true };
        }
      });

      const results = await Promise.allSettled(enrichedGradesPromises);

      const successfullyEnrichedGrades = [];
      let subjectFetchFailures = 0;
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          successfullyEnrichedGrades.push(result.value);
          if (result.value.errorFetchingSubjects) {
            subjectFetchFailures++;
          }
        } else {
          console.error("Unexpected error enriching grade:", result.reason);
          subjectFetchFailures++;
        }
      });

      setAllSubjects(subjectRes.data || []);
      setGrades(successfullyEnrichedGrades);

      if (subjectFetchFailures > 0 && showMainSpinner) {
        setActionFeedback({
          message: `Could not load subjects for ${subjectFetchFailures} grade(s). Check console for details.`,
          type: 'error'
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setActionFeedback({
        message: error.response?.data?.message || 'Error loading page data. Please try refreshing.',
        type: 'error'
      });
      setGrades([]);
      setAllSubjects([]);
    } finally {
      if (showMainSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleGradeUpdate = (feedback) => {
    setActionFeedback(feedback);

    if (feedback.type === 'success') {
      setTimeout(() => {
        fetchData(false); 
      }, 600); // Short delay so the success message shows before re-render
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg text-gray-500 ml-4">Loading Grades...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grades (7–12)</h1>
        <Link to="/grades/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Grade
        </Link>
      </div>

      {grades.length === 0 ? (
        <div className="text-center text-gray-500">No grades found.</div>
      ) : (
        grades.map((grade) => (
          <GradeCard
            key={grade.id}
            grade={grade}
            allSubjects={allSubjects}
            onUpdate={handleGradeUpdate}
          />
        ))
      )}

      {actionFeedback.message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 transition-opacity duration-300
          ${actionFeedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {actionFeedback.message}
        </div>
      )}
    </div>
  );
};

export default GradeList;