import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/teachers');
        setTeachers(response.data);
      } catch (err) {
        setError('Failed to fetch teachers'); // Keeps error in state for debugging/logging
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await axios.delete(`/teachers/${id}`);
        setTeachers(teachers.filter(teacher => teacher.id !== id));
      } catch (err) {
        // Optional: alert('Failed to delete teacher');
        setError('Failed to delete teacher');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  // Removed error UI display here

  return (
    <div className="teacher-list">
      <div className="page-header">
        <h1>Teachers</h1>
        <Link to="/teachers/create" className="btn-primary">Add Teacher</Link>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Shift</th>
              <th>Max Hours</th>
              <th>Subjects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length > 0 ? (
              teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.phone}</td>
                  <td>{teacher.shift}</td>
                  <td>{teacher.max_hours}</td>
                  <td>
                    {teacher.subjects?.map(subject => subject.name).join(', ')}
                  </td>
                  <td className="actions">
                    <Link to={`/teachers/edit/${teacher.id}`} className="btn-edit">Edit</Link>
                    <button 
                      onClick={() => handleDelete(teacher.id)} 
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No teachers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherList;
