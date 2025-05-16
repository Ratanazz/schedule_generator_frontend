import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentGrade, setCurrentGrade] = useState(7);
  
  const grades = [7, 8, 9, 10, 11, 12];

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/schedules?grade=${currentGrade}`);
        setSchedules(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch schedules. Please try again later.');
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [currentGrade]);

  const handleDeleteSchedule = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await axios.delete(`/api/schedules/${id}`);
        setSchedules(schedules.filter(schedule => schedule.id !== id));
      } catch (err) {
        setError('Failed to delete schedule. Please try again later.');
      }
    }
  };

  const handleGradeChange = (grade) => {
    setCurrentGrade(grade);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Class Schedules</h1>
        <Link to="/schedules/create" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create New Schedule
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="mr-4 font-medium">Select Grade:</span>
          <div className="flex space-x-2">
            {grades.map(grade => (
              <button
                key={grade}
                onClick={() => handleGradeChange(grade)}
                className={`px-4 py-2 rounded ${currentGrade === grade ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading schedules...</div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8">
          <p className="mb-4">No schedules found for Grade {currentGrade}.</p>
          <Link to="/schedules/create" className="text-blue-500 underline">Create a new schedule</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">ID</th>
                <th className="border border-gray-300 px-4 py-2">Grade</th>
                <th className="border border-gray-300 px-4 py-2">Created At</th>
                <th className="border border-gray-300 px-4 py-2 w-1/4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="border border-gray-300 px-4 py-2">{schedule.id}</td>
                  <td className="border border-gray-300 px-4 py-2">Grade {schedule.grade}</td>
                  <td className="border border-gray-300 px-4 py-2">{new Date(schedule.created_at).toLocaleDateString()}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/schedules/${schedule.id}`} 
                        className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-1 px-2 rounded"
                      >
                        View
                      </Link>
                      <Link 
                        to={`/schedules/${schedule.id}/edit`} 
                        className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm font-bold py-1 px-2 rounded"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-2 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScheduleList;