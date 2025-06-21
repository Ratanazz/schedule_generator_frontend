import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FaChalkboardTeacher,
  FaBook,
  FaGraduationCap,
  FaSchool,
  FaCalendarAlt,
  FaSignOutAlt,
  FaTimes,
  FaBars,
  FaHome,
  FaUserGraduate,
  FaUserCircle
} from 'react-icons/fa';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Close sidebar on route change (for mobile view)
  useEffect(() => {
    if (window.innerWidth < 768 && isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname, isOpen]);

  if (!currentUser) return null;

  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ease-in-out group ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-300'
    }`;

  const iconClasses = "mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-300 transition-colors duration-200 ease-in-out";
  const activeIconClasses = "mr-3 h-5 w-5 text-white";

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-gray-800/80 backdrop-blur-sm text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 z-40 print:hidden`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-700/50">
          <NavLink to="/" className="flex items-center space-x-3 group" title="Go to Dashboard">
            <FaHome className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors whitespace-nowrap">
              Scheduler Pro
            </span>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {[
            { to: "/teachers", icon: FaChalkboardTeacher, label: "Teachers" },
            { to: "/subjects", icon: FaBook, label: "Subjects" },
            { to: "/grades", icon: FaGraduationCap, label: "Grades" },
            { to: "/classes", icon: FaSchool, label: "Classes" },
            { to: "/students", icon: FaUserGraduate, label: "Student" },
            { to: "/schedules", icon: FaCalendarAlt, label: "Schedules" },
            { to: "/teacher-schedules", icon: FaCalendarAlt, label: "TeacherSchedules" },
          ].map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <item.icon className={isActive ? activeIconClasses : iconClasses} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-5 border-t border-gray-700/50 mt-auto">
          <div className="flex items-center space-x-3 mb-3">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || currentUser.email}
                className="h-10 w-10 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <FaUserCircle className="h-10 w-10 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[150px]" title={currentUser.displayName || currentUser.name}>
                {currentUser.displayName || currentUser.name || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
            title="Logout"
          >
            <FaSignOutAlt className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;
