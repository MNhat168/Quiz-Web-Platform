import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Checkotp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/verify-otp', {
        email: location.state?.email,
        otp: otp,
        isPasswordReset: location.state?.isPasswordReset || false
      });

      if (response.status === 200) {
        setMessage('Xác thực thành công! Đang chuyển hướng...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: location.state?.isPasswordReset 
                ? 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.'
                : 'Đăng ký thành công! Vui lòng đăng nhập.'
            }
          });
        }, 2000);
      }
    } catch (error: any) {
      setMessage(error.response?.data || 'Có lỗi xảy ra khi xác thực OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            Xác thực Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vui lòng nhập mã OTP đã được gửi đến email của bạn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Mã OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setOtp(value);
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xác thực...' : 'Xác thực'}
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-4 text-center">
            <p className={`text-sm font-medium ${
              message.includes('thành công') 
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

export default Checkotp;
