import { useState, useContext } from 'react'
import Login from "./screens/Login";
import AdminDashboard from './screens/admin/AdminDashboard';
import StudentDashboard from './screens/student/StudentDashboard';
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
import TeacherCreateRoom from './screens/teacher/TeacherCreateRoom';
import StudentJoinRoom from './screens/student/StudentJoinRoom';
import TeacherCreateClass from './screens/teacher/TeacherCreateClass';
import StudentJoinClass from './screens/student/StudentJoinClass';
import ClassDetail from './screens/teacher/ClassDetail';

function App() {
  const auth = useContext(AuthContext);
  const role = localStorage.getItem("role");

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

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
                {/* <TeacherCreateRoom /> */}
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/class-management"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                {/* <TeacherCreateRoom /> */}
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

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
                {/* <StudentJoinRoom /> */}
                <StudentJoinClass />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Nếu không khớp route nào thì chuyển về login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

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
                {/* <TeacherCreateRoom /> */}
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/class-management"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                {/* <TeacherCreateRoom /> */}
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

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
                {/* <StudentJoinRoom /> */}
                <StudentJoinClass />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Nếu không khớp route nào thì chuyển về login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
