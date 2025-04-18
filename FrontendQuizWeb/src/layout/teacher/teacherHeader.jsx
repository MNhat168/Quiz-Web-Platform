import React, { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../style/teacher-header.css"
import axios from 'axios';

const teacherHeader = () => {
  const { name, role, token } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('avatarUrl'));
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useAuth();
  
  useEffect(() => {
    const handleStorageChange = () => {
      setAvatarUrl(localStorage.getItem('avatarUrl'));
    };

    window.addEventListener('avatarUpdated', handleStorageChange);
    return () => window.removeEventListener('avatarUpdated', handleStorageChange);
  }, []);
  
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvatarUrl(res.data.avatarUrl);
      } catch (err) {
        console.error("Failed to fetch avatar", err);
      }
    };
    
    if (token) fetchAvatar();
  }, [token]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname.toLowerCase();
    
    // Xử lý cả 2 định dạng URL
    if (path.startsWith("/class-management") || 
        path.startsWith("/class%20management") || 
        path.startsWith("/classes")) {
      return "Class Management";
    }
    
    switch (path) {
      case "/teacher":
        return "Dashboard";
      case "/quizzes":
        return "Quizzes";
      case "/profile":
        return "Your Profile";
      default:
        return "Home";
    }
  };

  return (
    <header className="dashboard-header">

        <div className="header-left">
            <div className="logo-wrapper">
            <div className="logo-container">
                <div className="logo-circle">Q</div>
                <span className="logo-text">uiz</span>
            </div>
            {/* <div className={`role-badge ${role?.toLowerCase()}`}>
                {role || "GUEST"}
            </div> */}
            </div>
            <h1 className="header-title">{getPageTitle()}</h1>
        </div>

        <div className="header-right" ref={dropdownRef}>
            <div className="user-profile">
                <div className="user-info">
                <span className="user-name">{name || "Guest"}</span>
                <span className="user-role">{role || "Unknown"}</span>
                </div>

                <div className="avatar-dropdown-container">
                <div className="avatar-wrapper" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="User avatar" 
                      className="avatar" 
                    />
                  ) : (
                    <div className="avatar">
                      <span>{name?.charAt(0)?.toUpperCase() || "G"}</span>
                    </div>
                  )}
                  {/* ... */}
                </div>

                {dropdownOpen && (
                    <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                    <i className="icon-user"></i> Profile
                    </Link>
                    <div className="dropdown-item">
                        <i className="icon-settings"></i> Settings
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={logout}>
                        <i className="icon-logout"></i> Logout
                    </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    </header>
  );
};

export default teacherHeader;