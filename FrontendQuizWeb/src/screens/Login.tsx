import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    // Clear old data before login
    localStorage.clear();

    try {
      const response = await axios({
        method: 'post',
        url: 'http://localhost:8080/api/auth/login',
        data: {
          email: email,
          password: password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        // Save user data to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('username', response.data.name || email);

        // Update AuthContext using login function
        login(response.data.token, response.data.role, response.data.name || email);

        // Set success message
        setMessage("Đăng nhập thành công!");

        // Redirect based on role
        switch(response.data.role) {
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'TEACHER':
            navigate('/teacher');
            break;
          case 'STUDENT':
            navigate('/student');
            break;
          default:
            setMessage("Role không hợp lệ!");
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any partial data in case of error
      localStorage.clear();
      
      if (error.response) {
        setMessage(`Đăng nhập thất bại: ${error.response.data.message || 'thông tin đăng nhập không chính xác'}`);
      } else if (error.request) {
        setMessage("Không thể kết nối đến server");
      } else {
        setMessage("Lỗi không xác định");
      }
    }
  };

  return (
    <div className="!min-h-screen !w-full !relative !flex !items-center !justify-center !overflow-hidden">
      {/* Background image */}
      <div className="!absolute !inset-0 !bg-purple-900">
        <img 
          src='/bg-login.jpg' 
          alt="Background" 
          className="!w-full !h-full !object-cover "
        />
        <div className="!absolute !inset-0 !bg-black/10"></div>
      </div>
  
      {/* Login Form */}
      <div className="!relative !z-10 !w-full !max-w-md !mx-auto">
        <div className="!backdrop-blur-md !bg-white/10 !rounded-2xl !border !border-white/20 !shadow-xl !p-8 !text-center">
          <h2 className="!text-3xl !font-bold !text-white !mb-8">Login</h2>
  
          <form onSubmit={handleLogin} className="!space-y-6">
            <div className="!relative">
              <input
                type="text"
                id="username"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="!w-full !bg-white/30 !backdrop-blur-sm !text-white !font-semibold !placeholder-white/100 !px-4 !py-3 !rounded-lg !border !border-white/40 !focus:outline-none !focus:ring-2 !focus:ring-white/50 !pr-10"
                required
              />
              <div className="!absolute !right-3 !top-3 !text-white/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="!h-6 !w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
  
            <div className="!relative">
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="!w-full !bg-white/30 !backdrop-blur-sm !text-white !font-semibold !placeholder-white/100 !px-4 !py-3 !rounded-lg !border !border-white/40 !focus:outline-none !focus:ring-2 !focus:ring-white/50 !pr-10"
                required
              />
              <div className="!absolute !right-3 !top-3 !text-white/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="!h-6 !w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
  
            <div className="!flex !items-center !justify-between !text-sm">
              <div className="!flex !items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="!h-4 !w-4 !rounded !border-white/30 !bg-white/20 !text-purple-600 !focus:ring-purple-500"
                />
                <label htmlFor="remember-me" className="!ml-2 !block !text-white">
                  Remember me
                </label>
              </div>
              <div 
                onClick={() => navigate('/forgot-password')}
                className="!text-white !hover:text-purple-200 !cursor-pointer"
              >
                Forgot password?
              </div>
            </div>
  
            <button
              type="submit"
              className="!w-full !bg-white !text-purple-900 !font-medium !py-3 !px-4 !rounded-full !hover:bg-purple-100 !transition !duration-300 !focus:outline-none !focus:ring-2 !focus:ring-white/50"
            >
              Login
            </button>
          </form>
  
          <div className="!mt-6 !text-white !text-sm">
            Don't have an account?{" "}
            <span
              onClick={() => navigate('/signup')}
              className="!font-medium !text-white !hover:text-purple-200 !cursor-pointer"
            >
              Register
            </span>
          </div>
  
          {message && (
            <div className="!mt-4 !text-center">
              <p className={`!text-sm !font-medium ${
                message.includes('thành công') 
                  ? '!text-green-400 !bg-green-900/30 !p-2 !rounded-lg' 
                  : '!text-red-400 !bg-red-900/30 !p-2 !rounded-lg'
              }`}>
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
