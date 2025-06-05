import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherForm.css'; // Import the CSS file

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
    subject_ids: [],
    image: null,
    image_url: '',
  });

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('/subjects');
        setSubjects(response.data);
      } catch (err) {
        setError('Failed to fetch subjects');
      }
    };

    const fetchTeacher = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const response = await axios.get(`/teachers/${id}`);
          const teacherData = response.data;

          setFormData({
            name: teacherData.name,
            email: teacherData.email,
            phone: teacherData.phone,
            shift: teacherData.shift,
            max_hours: teacherData.max_hours,
            subject_ids: teacherData.subjects.map(subject => subject.id),
            image: null,
            image_url: teacherData.image_url || '', // assumes your API returns image_url
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

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubjectChange = (e) => {
    const subjectId = parseInt(e.target.value);
    let newSubjectIds;

    if (e.target.checked) {
      newSubjectIds = [...formData.subject_ids, subjectId];
    } else {
      newSubjectIds = formData.subject_ids.filter(id => id !== subjectId);
    }

    setFormData(prev => ({
      ...prev,
      subject_ids: newSubjectIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('phone', formData.phone);
      payload.append('shift', formData.shift);
      payload.append('max_hours', formData.max_hours);
      formData.subject_ids.forEach(id => payload.append('subject_ids[]', id));
      if (formData.image) {
        payload.append('image', formData.image);
      }

      if (isEditMode) {
        await axios.post(`/teachers/${id}?_method=PUT`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post('/teachers', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setLoading(false);
      navigate('/teachers');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save teacher';
      setError(message);
      setLoading(false);
    }
  };

  if (loading) return <div aria-live="polite">Loading...</div>;

  return (
    <div className="teacher-form">
      <h1>{isEditMode ? 'Edit Teacher' : 'Add Teacher'}</h1>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label={isEditMode ? 'Edit teacher form' : 'Add teacher form'}>
        <div className="form-group name-with-photo">
          <div className="name-input">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              aria-required="true"
            />
          </div>

          {formData.image_url && !formData.image && (
            <div className="teacher-photo-preview">
              <img src={formData.image_url} alt="Teacher" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Profile Image</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="shift">Shift</label>
          <select
            id="shift"
            name="shift"
            value={formData.shift}
            onChange={handleChange}
            required
            aria-required="true"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="BOTH">BOTH</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="max_hours">Maximum Hours per Week</label>
          <input
            type="number"
            id="max_hours"
            name="max_hours"
            value={formData.max_hours}
            onChange={handleChange}
            min="1"
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <fieldset>
            <legend>Subjects</legend>
            <div className="checkbox-group">
              {subjects.map(subject => (
                <div key={subject.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`subject-${subject.id}`}
                    value={subject.id}
                    checked={formData.subject_ids.includes(subject.id)}
                    onChange={handleSubjectChange}
                    aria-labelledby={`subject-label-${subject.id}`}
                  />
                  <label id={`subject-label-${subject.id}`} htmlFor={`subject-${subject.id}`}>
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/teachers')}
            aria-label="Cancel and return to teachers list"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            aria-label={isEditMode ? 'Update teacher information' : 'Save new teacher'}
            disabled={loading}
          >
            {isEditMode ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;
