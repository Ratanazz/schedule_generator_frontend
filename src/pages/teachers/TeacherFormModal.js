import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TeacherFormModal = ({ isOpen, onClose, teacherToEdit, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shift: 'AM',
    max_hours: 40,
    subject_ids: [],
    grade_ids: [],         // <-- added for grades
    image: null,
    image_url: '',
  });

  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);  // <-- store grades here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const modalContentRef = useRef(null);

  const isEditMode = !!teacherToEdit;

  useEffect(() => {
    if (isOpen) {
      if (subjects.length === 0) {
        axios.get('/subjects')
          .then(res => setSubjects(res.data))
          .catch(() => setError('Failed to load subjects.'));
      }
      if (grades.length === 0) {
        axios.get('/grades')   // <-- Fetch grades
          .then(res => setGrades(res.data))
          .catch(() => setError('Failed to load grades.'));
      }
    }
  }, [isOpen, subjects.length, grades.length]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && teacherToEdit) {
        setFormData({
          name: teacherToEdit.name || '',
          email: teacherToEdit.email || '',
          phone: teacherToEdit.phone || '',
          shift: teacherToEdit.shift || 'AM',
          max_hours: teacherToEdit.max_hours || 40,
          subject_ids: teacherToEdit.subjects ? teacherToEdit.subjects.map(s => s.id) : [],
          grade_ids: teacherToEdit.grades ? teacherToEdit.grades.map(g => g.id) : [],  // <-- set grade_ids from teacherToEdit
          image: null,
          image_url: teacherToEdit.image_url || '',
        });
        setImagePreview(teacherToEdit.image_url || null);
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          shift: 'AM',
          max_hours: 40,
          subject_ids: [],
          grade_ids: [],  // <-- reset grade_ids
          image: null,
          image_url: '',
        });
        setImagePreview(null);
        setError('');
      }
    }
  }, [isOpen, teacherToEdit, isEditMode]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file, image_url: '' }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
      setImagePreview(isEditMode && teacherToEdit ? teacherToEdit.image_url : null);
    }
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
    const newSubjectIds = e.target.checked
      ? [...formData.subject_ids, subjectId]
      : formData.subject_ids.filter(id => id !== subjectId);
    setFormData(prev => ({ ...prev, subject_ids: newSubjectIds }));
  };

  // New: handle grade selection changes
  const handleGradeChange = (e) => {
    const gradeId = parseInt(e.target.value);
    const newGradeIds = e.target.checked
      ? [...formData.grade_ids, gradeId]
      : formData.grade_ids.filter(id => id !== gradeId);
    setFormData(prev => ({ ...prev, grade_ids: newGradeIds }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('email', formData.email);
    payload.append('phone', formData.phone);
    payload.append('shift', formData.shift);
    payload.append('max_hours', formData.max_hours);
    formData.subject_ids.forEach(id => payload.append('subject_ids[]', id));
    formData.grade_ids.forEach(id => payload.append('grade_ids[]', id));  // <-- add grades to payload
    if (formData.image) {
      payload.append('image', formData.image);
    }

    try {
      if (isEditMode && teacherToEdit) {
        await axios.post(`/teachers/${teacherToEdit.id}?_method=PUT`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post('/teachers', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSaveSuccess();
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} teacher.`;
      const errors = err.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(' ');
        setError(`${message} ${errorMessages}`);
      } else {
        setError(message);
      }
      console.error("Submit error:", err.response || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-50 p-4 overflow-y-auto">
      <div ref={modalContentRef} className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shift</label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
                <option value="BOTH">BOTH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Hours</label>
              <input
                name="max_hours"
                type="number"
                value={formData.max_hours}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-full" />
              )}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
            {subjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                {subjects.map(subject => (
                  <div key={subject.id} className="flex items-center">
                    <input
                      type="checkbox"
                      value={subject.id}
                      id={`subject-${subject.id}`}
                      checked={formData.subject_ids.includes(subject.id)}
                      onChange={handleSubjectChange}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <label htmlFor={`subject-${subject.id}`} className="ml-2 text-sm text-gray-700">
                      {subject.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No subjects available.</p>
            )}
          </div>

          {/* Grades (new) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grades</label>
            {grades.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                {grades.map(grade => (
                  <div key={grade.id} className="flex items-center">
                    <input
                      type="checkbox"
                      value={grade.id}
                      id={`grade-${grade.id}`}
                      checked={formData.grade_ids.includes(grade.id)}
                      onChange={handleGradeChange}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <label htmlFor={`grade-${grade.id}`} className="ml-2 text-sm text-gray-700">
                      {grade.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No grades available.</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Teacher' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherFormModal;
