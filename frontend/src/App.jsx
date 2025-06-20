import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import CourseDetail from './pages/CourseDetail';
import CoursePlayer from './pages/CoursePlayer';
import CreateCourse from './pages/CreateCourse';
import Courses from './pages/Courses';
import Notes from './pages/Notes';
import Badges from './pages/Badges';
import VoiceQuiz from './pages/VoiceQuiz';
import VoiceQuizPage from './pages/VoiceQuizPage';
import SelfPacedMode from './pages/SelfPacedMode';
import FocusStudy from './pages/FocusStudy';
import TaskBoard from './pages/TaskBoard';
import StudyAnalytics from './pages/StudyAnalytics';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'instructor' ? '/instructor' : '/dashboard'} replace />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'instructor' ? '/instructor' : '/dashboard'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'instructor' ? '/instructor' : '/dashboard'} /> : <Register />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />

        {/* Protected Student Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn/:courseId"
          element={
            <ProtectedRoute requiredRole="student">
              <CoursePlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute requiredRole="student">
              <Notes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/badges"
          element={
            <ProtectedRoute requiredRole="student">
              <Badges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/voice-quiz"
          element={
            <ProtectedRoute requiredRole="student">
              <VoiceQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute requiredRole="student">
              <VoiceQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/self-paced"
          element={
            <ProtectedRoute requiredRole="student">
              <SelfPacedMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/self-paced/focus-study"
          element={
            <ProtectedRoute requiredRole="student">
              <FocusStudy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/self-paced/task-board"
          element={
            <ProtectedRoute requiredRole="student">
              <TaskBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/self-paced/analytics"
          element={
            <ProtectedRoute requiredRole="student">
              <StudyAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Protected Instructor Routes */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute requiredRole="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/create-course"
          element={
            <ProtectedRoute requiredRole="instructor">
              <CreateCourse />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
