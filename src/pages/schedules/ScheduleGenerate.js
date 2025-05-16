import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ScheduleGenerate = () => {
  const { id } = useParams(); // Schedule ID
  const navigate = useNavigate();
  
  const [schedule, setSchedule] = useState(null);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleResponse, gradesResponse] = await Promise.all([
          axios.get(`/api/schedules/${id}`),
          axios.get('/api/grades')
        ]);
        
        setSchedule(scheduleResponse.data);
        setGrades(gradesResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch required data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleGradeChange = (e) => {
    setSelectedGrade(e.target.value);
  };
  
  const handleGenerateSchedule = async () => {
    if (!selectedGrade) {
      setError('Please select a grade');
      return;
    }
    
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      
      await axios.post('/api/schedules/generate-for-grade', {
        grade_id: selectedGrade,
        schedule_id: id
      });
      
      setSuccess('Schedule generated successfully!');
      setGenerating(false);
    } catch (err) {
      setError('Failed to generate schedule. Please try again.');
      setGenerating(false);
    }
  };
  
  const handleViewSchedule = () => {
    navigate(`/schedules/view/${id}?grade=${selectedGrade}`);
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="schedule-generate">
      <h1>Generate Schedule</h1>
      <div className="schedule-info">
        <h2>{schedule.name}</h2>
        <p>Academic Year: {schedule.academic_year}</p>
        <p>Semester: {schedule.semester}</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <div className="generate-form">
        <div className="form-group">
          <label>Select Grade</label>
          <select 
            value={selectedGrade}
            onChange={handleGradeChange}
            required
          >
            <option value="">-- Select Grade --</option>
            {grades.map(grade => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-primary"
            onClick={handleGenerateSchedule}
            disabled={generating || !selectedGrade}
          >
            {generating ? 'Generating...' : 'Generate Schedule'}
          </button>
          
          {success && (
            <button 
              className="btn-secondary"
              onClick={handleViewSchedule}
            >
              View Generated Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleGenerate;