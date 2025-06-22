import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import Dashboard from './pages/Dashboard';
import TeacherList from './pages/teachers/TeacherList';
import SubjectDetail from './pages/subjects/SubjectDetail';
import SubjectList from './pages/subjects/SubjectList';
import SubjectForm from './pages/subjects/SubjectForm';
import GradeclassList from './pages/gradeclass/GradeclassList';
import GradeclassForm from './pages/gradeclass/GradeclassForm';
import GradeList from './pages/grades/GradeList';
import GradeForm from './pages/grades/GradeForm';
import StudentsPage from './pages/student/StudentsPage';
import ScheduleGenerationSetup from './pages/schedules/ScheduleGenerationSetup';
import ScheduleList from './pages/schedules/ScheduleList';

import ScheduleView from './pages/schedules/ScheduleView';
import ScheduleGenerate from './pages/schedules/ScheduleGenerate';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register'; // <-- Make sure you create this page
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import TeacherScheduleView from './pages/teacherschedules/TeacherScheduleView';
import AdminTeacherScheduleView from './pages/teacherschedules/AdminTeacherScheduleView';


const AppContent = () => {
  const location = useLocation();
  const authRoutes = ['/login', '/signup'];
  const isAuthPage = authRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar only on protected pages */}
      {!isAuthPage && <Sidebar />}

      <main className={`flex-1 ${!isAuthPage ? 'md:ml-64 p-6 bg-gray-100' : ''}`}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />

          {/* Dashboard */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Teacher Routes */}
          <Route path="/teachers" element={<ProtectedRoute><TeacherList /></ProtectedRoute>} />
          
          

          {/* Subject Routes */}
          <Route path="/subjects" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
          <Route path="/subjects/create" element={<ProtectedRoute><SubjectForm /></ProtectedRoute>} />
          <Route path="/subjects/edit/:id" element={<ProtectedRoute><SubjectForm /></ProtectedRoute>} />
          <Route path="/subjects/details" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />

          {/* Grade Routes */}
          <Route path="/grades" element={<ProtectedRoute><GradeList /></ProtectedRoute>} />
          <Route path="/grades/create" element={<ProtectedRoute><GradeForm /></ProtectedRoute>} />
          <Route path="/grades/edit/:id" element={<ProtectedRoute><GradeForm /></ProtectedRoute>} />

          {/* Gradeclass Routes */}
          <Route path="/classes" element={<ProtectedRoute><GradeclassList /></ProtectedRoute>} />
          <Route path="/classes/create" element={<ProtectedRoute><GradeclassForm /></ProtectedRoute>} />
          <Route path="/classes/edit/:id" element={<ProtectedRoute><GradeclassForm /></ProtectedRoute>} />
           {/* Student Routes */}
          <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          {/* Teacher Schedules */}
          <Route path="/teacher-schedules" element={<ProtectedRoute><TeacherScheduleView /></ProtectedRoute>} />
          <Route path="/teachers-schedules" element={<ProtectedRoute><AdminTeacherScheduleView /></ProtectedRoute>} />

          {/* Schedule Routes */}
          <Route path="/schedules" element={<ProtectedRoute><ScheduleList /></ProtectedRoute>} />
          
          
          <Route path="/schedules/view/:id" element={<ProtectedRoute><ScheduleView /></ProtectedRoute>} />
          <Route path="/schedules/generate/:id" element={<ProtectedRoute><ScheduleGenerate /></ProtectedRoute>} />
          <Route path="/schedules/generate-setup" element={<ProtectedRoute><ScheduleGenerationSetup /></ProtectedRoute>} />
        </Routes>
      </main>

      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router>
          <AppContent />
        </Router>
      </TooltipProvider>
    </AuthProvider>
  );
};

export default App;
