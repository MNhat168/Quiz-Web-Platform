import React, { useState, useEffect, ChangeEvent, FocusEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const navigate = useNavigate();
  
  interface FormData {
    email: string;
    username: string;
    displayName: string;
    password: string;
    role: string;
  }
  
  interface FormErrors {
    email: string;
    username: string;
    displayName: string;
    password: string;
    role: string;
  }
  
  interface FormTouched {
    email: boolean;
    username: boolean;
    displayName: boolean;
    password: boolean;
    role: boolean;
  }
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    role: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    role: ''
  });
  
  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    username: false,
    displayName: false,
    password: false,
    role: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) =>{
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
    return passwordRegex.test(password)
  }

  // Validate a specific field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!validateEmail(value)) return 'Invalid email format';
        return '';
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return '';
      case 'displayName':
        if (!value) return 'Display name is required';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (!validatePassword(value)) return 'Password must be minimum eight characters, at least one upper case English letter, one lower case English letter, one number and one special character';
        return '';
      case 'role':
        if (!value) return 'Please select a role';
        return '';
      default:
        return '';
    }
  };

  // Re-validate when input changes
  useEffect(() => {
    const validateTouchedFields = () => {
      const newErrors = { ...errors };
      
      Object.keys(touched).forEach(field => {
        const key = field as keyof FormTouched;
        if (touched[key]) {
          newErrors[key] = validateField(field, formData[key]);
        }
      });
      
      setErrors(newErrors);
    };
    
    validateTouchedFields();
  }, [formData, touched]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched when user types
    setTouched(prev => ({
      ...prev,
      [name as keyof FormTouched]: true
    }));
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    // Mark field as touched when it loses focus
    setTouched(prev => ({
      ...prev,
      [name as keyof FormTouched]: true
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role: role
    }));
    
    setTouched(prev => ({
      ...prev,
      role: true
    }));
  };

  const validateForm = () => {
    // Mark all fields as touched
    const allTouched: FormTouched = {
      email: true,
      username: true,
      displayName: true,
      password: true,
      role: true
    };
    setTouched(allTouched);
    
    // Validate all fields
    const newErrors: FormErrors = {
      email: '',
      username: '',
      displayName: '',
      password: '',
      role: ''
    };
    
    Object.keys(formData).forEach(key => {
      const fieldKey = key as keyof FormData;
      newErrors[fieldKey] = validateField(key, formData[fieldKey]);
    });
    setErrors(newErrors);
    
    // Check if any errors exist
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', formData);
      if (response.status === 200) {
        setMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.');
        navigate('/checkotp', { state: { email: formData.email } });
      }
    } catch (error: any) {
      if (error.response) {
        setMessage(error.response.data);
      } else {
        setMessage('An error occurred during registration');
      }
    } finally {
      setIsLoading(false);
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
          style={{
            transform: 'scale(1.0)',
            transformOrigin: 'center'
          }}
        />
        <div className="!absolute !inset-0 !bg-black/10"></div>
      </div>
  
      {/* Signup Form */}
      <div className="!relative !z-10 !w-full !max-w-md !mx-auto">
        <div className="!backdrop-blur-md !bg-white/20 !rounded-2xl !border !border-white/30 !shadow-xl !p-8 !text-center">
          <h2 className="!text-3xl !font-bold !text-white !mb-8">Sign Up</h2>
  
          <form onSubmit={handleSubmit} className="!space-y-6" noValidate>
            <div className="!relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Email"
                className="!w-full !bg-white/30 !backdrop-blur-sm !text-white !font-semibold !placeholder-white/100 !px-4 !py-3 !rounded-lg !border !border-white/40 !focus:outline-none !focus:ring-2 !focus:ring-white/50 !pr-10"
                required
              />
              {touched.email && errors.email && (
                <p className="!text-red-400 !text-xs !mt-1 !text-left">{errors.email}</p>
              )}
            </div>
  
            <div className="!relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Username"
                className="!w-full !bg-white/30 !backdrop-blur-sm !text-white !font-semibold !placeholder-white/100 !px-4 !py-3 !rounded-lg !border !border-white/40 !focus:outline-none !focus:ring-2 !focus:ring-white/50 !pr-10"
                required
              />
              {touched.username && errors.username && (
                <p className="!text-red-400 !text-xs !mt-1 !text-left">{errors.username}</p>
              )}
            </div>
  
            <div className="!relative">
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Display Name"
                className="!w-full !bg-white/30 !backdrop-blur-sm !text-white !font-semibold !placeholder-white/100 !px-4 !py-3 !rounded-lg !border !border-white/40 !focus:outline-none !focus:ring-2 !focus:ring-white/50 !pr-10"
                required
              />
              {touched.displayName && errors.displayName && (
                <p className="!text-red-400 !text-xs !mt-1 !text-left">{errors.displayName}</p>
              )}
            </div>
  
            <div className="!relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Password"
                className="!w-full !bg-white/30 !backdrop-blur-sm !text-white !font-semibold !placeholder-white/100 !px-4 !py-3 !rounded-lg !border !border-white/40 !focus:outline-none !focus:ring-2 !focus:ring-white/50 !pr-10"
                required
              />
              {touched.password && errors.password && (
                <p className="!text-red-400 !text-xs !mt-1 !text-left">{errors.password}</p>
              )}
            </div>
  
            {/* Creative Role Selection */}
            <div className="!relative">
              <p className="!text-white !text-sm !mb-2 !text-left">Choose your role:</p>
              <div className="!flex !space-x-4 !w-full">
                <div 
                  onClick={() => handleRoleChange('STUDENT')}
                  className={`!flex-1 !relative !overflow-hidden !bg-white/10 !backdrop-blur-sm !rounded-xl !border !transition-all !duration-300 !cursor-pointer !group ${formData.role === 'STUDENT' ? '!border-blue-400 !shadow-lg !shadow-blue-500/20 !scale-105' : '!border-white/30 !hover:border-white/50'}`}
                >
                  <div className="!absolute !inset-0 !bg-gradient-to-br !from-blue-500/20 !to-purple-500/20 !opacity-0 !group-hover:opacity-100 !transition-opacity !duration-300"></div>
                  <div className="!relative !z-10 !p-4 !flex !flex-col !items-center">
                    <div className="!w-16 !h-16 !rounded-full !bg-blue-500/20 !flex !items-center !justify-center !mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="!h-8 !w-8 !text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="!text-white !font-medium">Student</span>
                    <div className={`!w-full !h-1 !bg-blue-400 !mt-2 !transform !scale-x-0 !transition-transform !duration-300 ${formData.role === 'STUDENT' ? '!scale-x-100' : ''}`}></div>
                    
                    {/* Animated stars */}
                    <div className={`!absolute !top-1 !left-1 !w-2 !h-2 !rounded-full !bg-blue-300 !opacity-0 !transition-opacity !duration-500 ${formData.role === 'STUDENT' ? '!opacity-70' : ''}`} style={{ animationDelay: '0.2s' }}></div>
                    <div className={`!absolute !bottom-2 !right-3 !w-1.5 !h-1.5 !rounded-full !bg-purple-300 !opacity-0 !transition-opacity !duration-500 ${formData.role === 'STUDENT' ? '!opacity-70' : ''}`} style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleRoleChange('TEACHER')}
                  className={`!flex-1 !relative !overflow-hidden !bg-white/10 !backdrop-blur-sm !rounded-xl !border !transition-all !duration-300 !cursor-pointer !group ${formData.role === 'TEACHER' ? '!border-green-400 !shadow-lg !shadow-green-500/20 !scale-105' : '!border-white/30 !hover:border-white/50'}`}
                >
                  <div className="!absolute !inset-0 !bg-gradient-to-br !from-green-500/20 !to-teal-500/20 !opacity-0 !group-hover:opacity-100 !transition-opacity !duration-300"></div>
                  <div className="!relative !z-10 !p-4 !flex !flex-col !items-center">
                    <div className="!w-16 !h-16 !rounded-full !bg-green-500/20 !flex !items-center !justify-center !mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="!h-8 !w-8 !text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <span className="!text-white !font-medium">Teacher</span>
                    <div className={`!w-full !h-1 !bg-green-400 !mt-2 !transform !scale-x-0 !transition-transform !duration-300 ${formData.role === 'TEACHER' ? '!scale-x-100' : ''}`}></div>
                    
                    {/* Animated stars */}
                    <div className={`!absolute !top-2 !right-2 !w-2 !h-2 !rounded-full !bg-green-300 !opacity-0 !transition-opacity !duration-500 ${formData.role === 'TEACHER' ? '!opacity-70' : ''}`} style={{ animationDelay: '0.3s' }}></div>
                    <div className={`!absolute !bottom-3 !left-2 !w-1.5 !h-1.5 !rounded-full !bg-teal-300 !opacity-0 !transition-opacity !duration-500 ${formData.role === 'TEACHER' ? '!opacity-70' : ''}`} style={{ animationDelay: '0.6s' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Hidden select for form submission */}
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="!hidden"
                required
              >
                <option value="" className="!bg-purple-900">Select a role</option>
                <option value="STUDENT" className="!bg-purple-900">Student</option>
                <option value="TEACHER" className="!bg-purple-900">Teacher</option>
              </select>
              
              {touched.role && errors.role && (
                <p className="!text-red-400 !text-xs !mt-1 !text-left">{errors.role}</p>
              )}
            </div>
  
            <button
              type="submit"
              disabled={isLoading}
              className="!w-full !bg-white !text-purple-900 !font-medium !py-3 !px-4 !rounded-full !hover:bg-purple-100 !transition !duration-300 !focus:outline-none !focus:ring-2 !focus:ring-white/50 disabled:!opacity-50 disabled:!cursor-not-allowed"
            >
              {isLoading ? 'Đang xử lý...' : 'Sign Up'}
            </button>
          </form>
  
          <div className="!mt-6 !text-white !text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate('/login')}
              className="!font-medium !text-white !hover:text-purple-200 !cursor-pointer"
            >
              Sign in
            </span>
          </div>
  
          {message && (
            <div className="!mt-4 !text-center">
              <p className={`!text-sm !font-medium ${
                message.includes('OTP') 
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
};

export default Signup;