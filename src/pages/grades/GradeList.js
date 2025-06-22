import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GradeCard from './GradeCard';
import { Link } from 'react-router-dom';

const GradeList = () => {
  const [grades, setGrades] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const subjectRes = await axios.get('/subjects');
      const gradeRes = await axios.get('/grades');

      const gradesInRange = gradeRes.data.filter(g => {
        const level = parseInt(g.name);
        return level >= 7 && level <= 12;
      });

      const enrichedGrades = await Promise.all(
        gradesInRange.map(async (g) => {
          const res = await axios.get(`/grades/${g.id}/subjects`);
          return { ...g, subjects: res.data };
        })
      );

      setAllSubjects(subjectRes.data);
      setGrades(enrichedGrades);
    } catch {
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-lg text-gray-500 ml-4">Loading Grades...</p></div>)}

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
            onUpdate={fetchData}
          />
        ))
      )}
    </div>
  );
};

export default GradeList;
