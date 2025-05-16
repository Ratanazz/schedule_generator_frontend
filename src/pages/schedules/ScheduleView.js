import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ScheduleView = () => {
  const { id } = useParams(); // Schedule ID
  const [searchParams] = useSearchParams();
  const gradeId = searchParams.get('grade');
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(gradeId || '');
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8]; // Assuming 8 periods per day
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [scheduleResponse, gradesResponse, teachersResponse, subjectsResponse] = await Promise.all([
          axios.get(`/api/schedules/${id}`),
          axios.get('/api/grades'),
          axios.get('/api/teachers'),
          axios.get('/api/subjects')
        ]);
        
        setSchedule(scheduleResponse.data);
        setGrades(gradesResponse.data);
        setTeachers(teachersResponse.data);
        setSubjects(subjectsResponse.data);
        
        if (gradeId) {
          fetchScheduleData(gradeId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, gradeId]);

  const fetchScheduleData = async (gradeId) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/schedules/grade', {
        params: {
          grade_id: gradeId,
          schedule_id: id
        }
      });
      setScheduleData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch schedule data');
      setLoading(false);
    }
  };

  const handleGradeChange = (e) => {
    const newGradeId = e.target.value;
    setSelectedGrade(newGradeId);
    if (newGradeId) {
      navigate(`/schedules/view/${id}?grade=${newGradeId}`);
      fetchScheduleData(newGradeId);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getTeacherById = (teacherId) => {
    return teachers.find(teacher => teacher.id === teacherId) || { name: 'N/A' };
  };

  const getSubjectById = (subjectId) => {
    return subjects.find(subject => subject.id === subjectId) || { name: 'N/A' };
  };

  const getTeacherShift = (teacherId) => {
    const teacher = getTeacherById(teacherId);
    return teacher.shift || 'N/A';
  };

  const renderTimeSlot = (period) => {
    // This would typically come from your backend
    const periodTimes = {
      1: '8:00 - 8:45',
      2: '8:50 - 9:35',
      3: '9:40 - 10:25',
      4: '10:30 - 11:15',
      5: '11:20 - 12:05',
      6: '13:00 - 13:45', // After lunch break
      7: '13:50 - 14:35',
      8: '14:40 - 15:25'
    };
    
    return periodTimes[period] || '';
  };

  if (loading && !schedule) return <div className="text-center py-8">Loading...</div>;

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{error}</p>
      </div>
    );
  }

  const renderScheduleTable = () => {
    if (!selectedGrade) {
      return (
        <div className="no-grade-selected text-center p-8 bg-gray-100 rounded">
          <p className="text-lg">Please select a grade to view schedule</p>
        </div>
      );
    }

    if (loading) {
      return <div className="text-center py-8">Loading schedule data...</div>;
    }

    if (Object.keys(scheduleData).length === 0) {
      return (
        <div className="no-schedule-data text-center p-8 bg-gray-100 rounded">
          <p className="text-lg">No schedule data found for this grade. You may need to generate a schedule first.</p>
          <button 
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            onClick={() => navigate(`/schedules/generate/${id}?grade=${selectedGrade}`)}
          >
            Generate Schedule
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Period / Time</th>
              {days.map(day => (
                <th key={day} className="py-2 px-4 border">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period}>
                <td className="py-2 px-4 border font-medium bg-gray-50">
                  Period {period}
                  <br />
                  <span className="text-xs text-gray-500">{renderTimeSlot(period)}</span>
                </td>
                {days.map(day => {
                  const slot = scheduleData[day] && scheduleData[day][period];
                  if (!slot) {
                    return <td key={day} className="py-2 px-4 border text-center text-gray-400">-</td>;
                  }
                  
                  const teacher = getTeacherById(slot.teacher_id);
                  const subject = getSubjectById(slot.subject_id);
                  const shift = getTeacherShift(slot.teacher_id);
                  
                  return (
                    <td key={day} className="py-2 px-4 border">
                      <div className="flex flex-col">
                        <span className="font-medium">{subject.name}</span>
                        <span className="text-sm">{teacher.name}</span>
                        <span className={`text-xs px-2 py-1 rounded mt-1 ${shift === 'AM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {shift} Shift
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {schedule ? schedule.name : 'Schedule View'}
        </h1>

        <div className="flex space-x-4">
          <div>
            <label htmlFor="gradeSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Select Grade:
            </label>
            <select
              id="gradeSelect"
              value={selectedGrade}
              onChange={handleGradeChange}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="">-- Select Grade --</option>
              {grades
                .filter(grade => grade.level >= 7 && grade.level <= 12)
                .map(grade => (
                  <option key={grade.id} value={grade.id}>
                    Grade {grade.level} - {grade.section}
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            disabled={!selectedGrade || Object.keys(scheduleData).length === 0}
          >
            Print Schedule
          </button>

          <button
            onClick={() => navigate('/schedules')}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Back to Schedules
          </button>
        </div>
      </div>

      {renderScheduleTable()}

      {selectedGrade && schedule && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate(`/schedules/edit/${id}?grade=${selectedGrade}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mr-4"
          >
            Edit Schedule
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;