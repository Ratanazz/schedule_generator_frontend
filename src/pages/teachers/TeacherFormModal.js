// src/components/TeacherFormModal.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// You might need to adjust the path if TeacherForm.css is in a different location
// or integrate styles directly with Tailwind
// import './TeacherForm.css'; // Keep if you have specific styles here

const TeacherFormModal = ({ isOpen, onClose, teacherToEdit, onSaveSuccess }) => {
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
  const [imagePreview, setImagePreview] = useState(null);
  const modalContentRef = useRef(null);

  const isEditMode = !!teacherToEdit;

  // Fetch subjects when modal opens (if not already fetched)
  useEffect(() => {
    if (isOpen && subjects.length === 0) {
      const fetchSubjects = async () => {
        try {
          const response = await axios.get('/subjects');
          setSubjects(response.data);
        } catch (err) {
          console.error("Failed to fetch subjects:", err);
          setError('Failed to load subjects. Please try again.');
        }
      };
      fetchSubjects();
    }
  }, [isOpen, subjects.length]);

  // Populate form if in edit mode or reset if opening for add
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && teacherToEdit) {
        setFormData({
          name: teacherToEdit.name || '',
          email: teacherToEdit.email || '',
          phone: teacherToEdit.phone || '',
          shift: teacherToEdit.shift || 'AM',
          max_hours: teacherToEdit.max_hours || 40,
          subject_ids: teacherToEdit.subjects ? teacherToEdit.subjects.map(subject => subject.id) : [],
          image: null, // Reset image file input
          image_url: teacherToEdit.image_url || '',
        });
        setImagePreview(teacherToEdit.image_url || null);
      } else {
        // Reset form for "add" mode or if teacherToEdit is not provided
        setFormData({
          name: '',
          email: '',
          phone: '',
          shift: 'AM',
          max_hours: 40,
          subject_ids: [],
          image: null,
          image_url: '',
        });
        setImagePreview(null);
        setError(''); // Clear previous errors
      }
    }
  }, [isOpen, teacherToEdit, isEditMode]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file, image_url: '' /* Clear old image_url if new file selected */ }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      // If file selection is cancelled, revert to original image_url if editing, or null
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
    let newSubjectIds;
    if (e.target.checked) {
      newSubjectIds = [...formData.subject_ids, subjectId];
    } else {
      newSubjectIds = formData.subject_ids.filter(id => id !== subjectId);
    }
    setFormData(prev => ({ ...prev, subject_ids: newSubjectIds }));
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
    if (formData.image) {
      payload.append('image', formData.image);
    }
    // If not sending a new image, and it's edit mode, and there was an original image_url,
    // you might need to send image_url or ensure backend doesn't clear it.
    // For simplicity, current backend likely handles "no new image = keep old one".

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
      onSaveSuccess(); // Trigger refresh in parent and close modal
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

  // Effect for closing modal with ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Effect for click outside to close
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-50 p-4 transition-opacity duration-300 ease-in-out overflow-y-auto">
      <div ref={modalContentRef} className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-2xl w-full my-8 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md shadow" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Name */}
            <div className="md:col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Email */}
            <div className="md:col-span-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Phone */}
            <div className="md:col-span-1">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Profile Image & Preview */}
            <div className="md:col-span-1 row-span-2">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover shadow-md" />
                </div>
              )}
            </div>


            {/* Shift */}
            <div className="md:col-span-1">
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">Shift <span className="text-red-500">*</span></label>
              <select
                id="shift"
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
                <option value="BOTH">BOTH</option>
              </select>
            </div>

            {/* Max Hours */}
            <div className="md:col-span-1">
              <label htmlFor="max_hours" className="block text-sm font-medium text-gray-700 mb-1">Max Hours/Week <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="max_hours"
                name="max_hours"
                value={formData.max_hours}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>


          {/* Subjects */}
          <div className="mt-6">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-1">Subjects</legend>
              {subjects.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {subjects.map(subject => (
                    <div key={subject.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`subject-${subject.id}`}
                        value={subject.id}
                        checked={formData.subject_ids.includes(subject.id)}
                        onChange={handleSubjectChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor={`subject-${subject.id}`} className="ml-2 text-sm text-gray-700">
                        {subject.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No subjects available or loading...</p>
              )}
            </fieldset>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition duration-150 shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition duration-150 shadow-sm disabled:opacity-50 disabled:bg-indigo-400"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Teacher' : 'Save Teacher')}
            </button>
          </div>
        </form>
      </div>
      {/* Ensure the modal animation style is available, e.g., from TeacherList or define it here if needed */}
       <style jsx global>{`
        @keyframes modalShow {
          0% { transform: scale(0.95) translateY(-20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-modalShow {
          animation: modalShow 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

export default TeacherFormModal;