import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPass = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!validatePassword(newPassword)) {
      setMessage('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/auth/forgot-password', {
        email: email,
        newPassword: newPassword
      });

      if (response.status === 200) {
        setMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.');
        navigate('/checkotp', { state: { email: email, isPasswordReset: true } });
      }
    } catch (error: any) {
      setMessage(error.response?.data || 'Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vui lòng nhập email và mật khẩu mới của bạn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>

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

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPass; 