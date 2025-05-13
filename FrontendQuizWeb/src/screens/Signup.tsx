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
  }, [formData, touched, errors]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-1 block w-full px-4 py-3 border ${
                  touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`mt-1 block w-full px-4 py-3 border ${
                  touched.username && errors.username ? 'border-red-500' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.username && errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className={`mt-1 block w-full px-4 py-3 border ${
                  touched.displayName && errors.displayName ? 'border-red-500' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Enter your display name"
                value={formData.displayName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.displayName && errors.displayName && (
                <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`mt-1 block w-full px-4 py-3 border ${
                  touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                className={`mt-1 block w-full px-4 py-3 border ${
                  touched.role && errors.role ? 'border-red-500' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                value={formData.role}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Select a role</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
              </select>
              {touched.role && errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xử lý...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out"
            >
              Sign in
            </button>
          </p>
        </div>

        {message && (
          <div className="mt-4 text-center">
            <p className={`text-sm font-medium ${
              message.includes('OTP') 
                ? 'text-green-600 bg-green-50 p-2 rounded-lg' 
                : 'text-red-600 bg-red-50 p-2 rounded-lg'
            }`}>
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;