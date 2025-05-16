import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { Toaster } from 'sonner';

import { TooltipProvider } from "./components/ui/tooltip";

import Dashboard from './pages/Dashboard';
import TeacherList from './pages/teachers/TeacherList';
import TeacherForm from './pages/teachers/TeacherForm';
import SubjectList from './pages/subjects/SubjectList';
import SubjectForm from './pages/subjects/SubjectForm';
import GradeList from './pages/grades/GradeList';
import GradeForm from './pages/grades/GradeForm';
import ScheduleList from './pages/schedules/ScheduleList';
import ScheduleForm from './pages/schedules/ScheduleForm';
import ScheduleView from './pages/schedules/ScheduleView';
import ScheduleGenerate from './pages/schedules/ScheduleGenerate';
import MainLayout from "./components/layout/MainLayout";
import Login from './pages/auth/Login';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <div className="content">
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* <Route path="/" element={<MainLayout />}></Route> */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              {/* Teacher Routes */}
              <Route path="/teachers" element={<ProtectedRoute><TeacherList /></ProtectedRoute>} />
              <Route path="/teachers/create" element={<ProtectedRoute><TeacherForm /></ProtectedRoute>} />
              <Route path="/teachers/edit/:id" element={<ProtectedRoute><TeacherForm /></ProtectedRoute>} />
              
              {/* Subject Routes */}
              <Route path="/subjects" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
              <Route path="/subjects/create" element={<ProtectedRoute><SubjectForm /></ProtectedRoute>} />
              <Route path="/subjects/edit/:id" element={<ProtectedRoute><SubjectForm /></ProtectedRoute>} />
              
              {/* Grade Routes */}
              <Route path="/grades" element={<ProtectedRoute><GradeList /></ProtectedRoute>} />
              <Route path="/grades/create" element={<ProtectedRoute><GradeForm /></ProtectedRoute>} />
              <Route path="/grades/edit/:id" element={<ProtectedRoute><GradeForm /></ProtectedRoute>} />
              
              {/* Schedule Routes */}
              <Route path="/schedules" element={<ProtectedRoute><ScheduleList /></ProtectedRoute>} />
              <Route path="/schedules/create" element={<ProtectedRoute><ScheduleForm /></ProtectedRoute>} />
              <Route path="/schedules/edit/:id" element={<ProtectedRoute><ScheduleForm /></ProtectedRoute>} />
              <Route path="/schedules/view/:id" element={<ProtectedRoute><ScheduleView /></ProtectedRoute>} />
              <Route path="/schedules/generate/:id" element={<ProtectedRoute><ScheduleGenerate /></ProtectedRoute>} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;