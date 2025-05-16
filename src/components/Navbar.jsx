import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">School Schedule Generator</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/teachers">Teachers</Link>
        <Link to="/subjects">Subjects</Link>
        <Link to="/grades">Grades</Link>
        <Link to="/schedules">Schedules</Link>
      </div>
      <div className="navbar-end">
        <span className="user-name">{currentUser.name}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;