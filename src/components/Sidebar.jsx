import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close' : 'Menu'}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 z-40`}
      >
        <div className="p-6 border-b border-gray-700">
          <Link
            to="/"
            className="text-xl font-bold text-white hover:text-blue-300 transition-colors"
          >
            School Schedule Generator
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-3">
          <Link
            to="/teachers"
            className="block px-4 py-2 text-base font-medium rounded-lg hover:bg-gray-700 hover:text-blue-300 transition-colors"
          >
            Teachers
          </Link>
          <Link
            to="/subjects"
            className="block px-4 py-2 text-base font-medium rounded-lg hover:bg-gray-700 hover:text-blue-300 transition-colors"
          >
            Subjects
          </Link>
          <Link
            to="/grades"
            className="block px-4 py-2 text-base font-medium rounded-lg hover:bg-gray-700 hover:text-blue-300 transition-colors"
          >
            Grades
          </Link>
          <Link
            to="/classes"
            className="block px-4 py-2 text-base font-medium rounded-lg hover:bg-gray-700 hover:text-blue-300 transition-colors"
          >
            Class
          </Link>
          <Link
            to="/schedules"
            className="block px-4 py-2 text-base font-medium rounded-lg hover:bg-gray-700 hover:text-blue-300 transition-colors"
          >
            Schedules
          </Link>
        </nav>
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium truncate">{currentUser.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;