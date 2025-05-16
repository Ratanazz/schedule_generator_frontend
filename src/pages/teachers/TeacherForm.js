import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shift: 'AM',
    max_hours: 40,
    subject_ids: []
  });
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('/api/subjects');
        setSubjects(response.data);
      } catch (err) {
        setError('Failed to fetch subjects');
      }
    };
    
    const fetchTeacher = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const response = await axios.get(`/api/teachers/${id}`);
          const teacherData = response.data;
          
          setFormData({
            name: teacherData.name,
            email: teacherData.email,
            phone: teacherData.phone,
            shift: teacherData.shift,
            max_hours: teacherData.max_hours,
            subject_ids: teacherData.subjects.map(subject => subject.id)
          });
          setLoading(false);
        } catch (err) {
          setError('Failed to fetch teacher details');
          setLoading(false);
        }
      }
    };
    
    fetchSubjects();
    fetchTeacher();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubjectChange = (e) => {
    const subjectId = parseInt(e.target.value);
    let newSubjectIds;
    
    if (e.target.checked) {
      newSubjectIds = [...formData.subject_ids, subjectId];
    } else {
      newSubjectIds = formData.subject_ids.filter(id => id !== subjectId);
    }
    
    setFormData({
      ...formData,
      subject_ids: newSubjectIds
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEditMode) {
        await axios.put(`/api/teachers/${id}`, formData);
      } else {
        await axios.post('/api/teachers', formData);
      }
      
      setLoading(false);
      navigate('/teachers');
    } catch (err) {
      setError('Failed to save teacher');
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="teacher-form">
      <h1>{isEditMode ? 'Edit Teacher' : 'Add Teacher'}</h1>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input 
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Phone</label>
          <input 
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Shift</label>
          <select 
            name="shift"
            value={formData.shift}
            onChange={handleChange}
            required
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="BOTH">BOTH</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Maximum Hours per Week</label>
          <input 
            type="number"
            name="max_hours"
            value={formData.max_hours}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Subjects</label>
          <div className="checkbox-group">
            {subjects.map(subject => (
              <div key={subject.id} className="checkbox-item">
                <input 
                  type="checkbox"
                  id={`subject-${subject.id}`}
                  value={subject.id}
                  checked={formData.subject_ids.includes(subject.id)}
                  onChange={handleSubjectChange}
                />
                <label htmlFor={`subject-${subject.id}`}>
                  {subject.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/teachers')}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {isEditMode ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;