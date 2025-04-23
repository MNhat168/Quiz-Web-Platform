import { useState, useContext } from 'react'
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import AdminDashboard from './screens/admin/AdminDashboard';
import TeacherDashboard from './screens/teacher/TeacherDashboard';
import Unauthorized from './screens/Unauthorized';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { Navigate, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

import TeacherCreateRoom from './screens/teacher/TeacherCreateRoom';
import StudentJoinRoom from './screens/student/StudentJoinRoom';
import TeacherCreateClass from './screens/teacher/TeacherCreateClass';
import StudentJoinClass from './screens/student/StudentJoinClass';
import ClassDetail from './screens/teacher/ClassDetail';
import Checkotp from './screens/Checkotp';
import Index from './screens/Index';
import StudentHome from './screens/student/Home';
import ProfileStudent from './screens/student/ProfileStudent';
import StudentLayout from './layout/student/StudentLayout';

function App() {
  const auth = useContext(AuthContext);
  const role = localStorage.getItem("role");

   return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/checkotp" element={<Checkotp />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/class-management"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TeacherCreateClass />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes/:classId"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <ClassDetail />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentHome />} />
            <Route path="profile" element={<ProfileStudent />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Nếu không khớp route nào thì chuyển về Index */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
