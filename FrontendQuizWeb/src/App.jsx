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
import TeacherCreateGame from './screens/teacher/TeacherCreateGame';
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
import SimpleSocketTest from './screens/teacher/Sockettest';
import GameActivityEditor from './screens/teacher/GameEditor';
import TeacherProfile from './screens/teacher/TeacherProfile';
import Logout from './screens/student/Logout';

import StudentGamePlay from './screens/student/StudentGameplay';
import GameCompletedLeaderboard from './screens/student/activities/Leaderboard';

function App() {
 

  return (
    <Router>
      <AuthProvider>
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
                {/* <TeacherCreateRoom /> */}
                {/* <SimpleSocketTest/> */}
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/game-room"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TeacherCreateRoom />
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
            path="/game-management"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TeacherCreateGame />
              </ProtectedRoute>
            }
          />

          <Route
            path="/games/edit/:gameId"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <GameActivityEditor />
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
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/join"
            element={
              <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
                <StudentJoinRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/play"
            element={
              <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
                <StudentGamePlay />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/completed"
            element={
              <ProtectedRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
                <GameCompletedLeaderboard />
              </ProtectedRoute>
            }
          />

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
            <Route path="logout" element={<Logout />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Nếu không khớp route nào thì chuyển về Index */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
