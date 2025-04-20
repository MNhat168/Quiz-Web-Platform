import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"
import Sidebar from "../../layout/teacher/teacherSidebar"
import Header from "../../layout/teacher/teacherHeader";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../../style/teacher-profile.css"
import { FaCamera } from 'react-icons/fa';

const TeacherProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    userId: '',
    avatarUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
      const fetchProfile = async () => {
          try {
              const res = await axios.get("http://localhost:8080/api/user/profile", {
                  headers: {
                      Authorization: `Bearer ${token}`,
                  },
              });
              setProfile({
                name: res.data.name,
                email: res.data.email,
                role: res.data.role,
                userId: res.data.userId,
                avatarUrl: res.data.avatarUrl
              });
          } catch (err) {
              console.error("Lỗi khi lấy thông tin profile", err);
              toast.error("Không thể tải thông tin hồ sơ");
          }
      };

      fetchProfile();
  }, [token]);

  const handleAvatarChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file
      if (!file.type.match('image.*')) {
          toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG)');
          return;
      }

      if (file.size > 10 * 1024 * 1024) {
          toast.error('Kích thước file tối đa là 5MB');
          return;
      }

      try {
          setIsUploading(true);
          const formData = new FormData();
          formData.append('file', file);

          console.log('Token:', token);
          console.log('UserID:', profile.userId);

          // Gọi API update avatar
          const response = await axios.post(
              `http://localhost:8080/api/user/${profile.userId}/avatar`,
              formData,
              {
                  headers: {
                      'Content-Type': 'multipart/form-data',
                      Authorization: `Bearer ${token}`,
                      "X-Teacher-Id": JSON.parse(atob(token.split(".")[1])).sub,
                  },
              }
          );

          // Cập nhật cả localStorage và phát sự kiện
          localStorage.setItem('avatarUrl', response.data.avatarUrl);
          window.dispatchEvent(new Event('avatarUpdated'));

          // Cập nhật state với dữ liệu mới
          setProfile(prev => ({
            ...prev,
            avatarUrl: response.data.avatarUrl 
          }));
          toast.success('Cập nhật avatar thành công!');
      } catch (err) {
          console.error("Lỗi khi cập nhật avatar", err);
          toast.error(err.response?.data?.message || 'Cập nhật avatar thất bại');
      } finally {
          setIsUploading(false);
      }
  };


  if (!profile) return <div className="text-center py-10">Loading...</div>;

  return (
    <>
      <Header />
      <div className="teacher-profile-container">
        <Sidebar />
        <div className="profile-content-wrapper">
          <div className="profile-card">
            {/* Phần header với avatar và tên */}
            <div className="profile-header">
              <div className="avatar-overlap-container">
                <div className="avatar-container">
                  <img
                    src={profile.avatarUrl || null}
                    alt="Avatar"
                    className="avatar-image"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  
                  <div className="avatar-hover-overlay">
                    <label htmlFor="avatar-upload" className="avatar-upload-icon">
                      <FaCamera />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="avatar-upload-input"
                    />
                  </div>
  
                  {isUploading && (
                    <div className="upload-loading">
                      <span>Đang tải lên...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <h2 className="profile-name">{profile.name}</h2>
            </div>
  
            {/* Card thông tin */}
            <div className="profile-info-card">
              <div className="profile-info">
                <div className="profile-info-item">
                  <p className="info-label">Email:</p>
                  <p className="info-value">{profile.email}</p>
                </div>
                <div className="profile-info-item">
                  <p className="info-label">Vai trò:</p>
                  <p className="info-value">{profile.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  };
  // Component phụ có thể giữ nguyên
  const ProfileInfoItem = ({ label, value }) => (
    <div className="profile-info-item">
      <p className="info-label">{label}:</p>
      <p className="info-value">{value}</p>
    </div>
  );

export default TeacherProfile;