import React, { useState } from 'react';
import axios from 'axios';

const ScheduleGenerate = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post('/schedule/generate', {
        academic_year: academicYear,
      });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Failed to generate schedule:', error);
      setMessage('Error generating schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Generate Class Schedules</h2>
      <input
        type="text"
        placeholder="Enter Academic Year (e.g., 2024-2025)"
        value={academicYear}
        onChange={(e) => setAcademicYear(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || !academicYear}
      >
        {loading ? 'Generating...' : 'Generate Schedule'}
      </button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
};

export default ScheduleGenerate;
