import { useState, useContext} from 'react'
import Login from "./screens/Login";
import AdminDashboard from './screens/AdminDashboard';
import StudentDashboard from './screens/StudentDashboard';
import TeacherDashboard from './screens/TeacherDashboard';
import Unauthorized from './screens/Unauthorized';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import { Navigate, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'

function App() {
  const auth = useContext(AuthContext);
  const role = localStorage.getItem("role");

  return (
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
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Nếu không khớp route nào thì chuyển về login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
export default App;
