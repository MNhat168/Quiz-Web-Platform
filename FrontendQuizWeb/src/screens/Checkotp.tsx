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
    <div className="!min-h-screen !w-full !relative !flex !items-center !justify-end !overflow-hidden">
      {/* Background image */}
      <div className="!absolute !inset-0 !bg-gray-200">
        <img 
          src='/bg-otp2.jpeg' 
          alt="Background" 
          className="!w-full !h-full !object-contain"
          style={{
            transform: 'scale(1.1) translateX(-1%)',
            transformOrigin: 'center',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
        <div className="!absolute !inset-0 !bg-black/10"></div>
      </div>
      
      <div className="!max-w-md !w-full !bg-white !relative !z-10 !border-4 !border-black !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] !mr-210">
        {/* Manga-style header with dramatic lines */}
        <div className="!bg-black !text-white !p-4 !relative !overflow-hidden">
          <div className="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-white !to-transparent !opacity-10 !transform !-skew-x-12"></div>
          <div className="!text-center !relative !z-10">
            <div className="!mx-auto !w-16 !h-16 !bg-white !border-4 !border-black !flex !items-center !justify-center !mb-3 !transform !rotate-45">
              <div className="!transform !-rotate-45">
                <svg className="!w-8 !h-8 !text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
            <h2 className="!text-2xl !font-black !tracking-wider !uppercase">
              XÁC THỰC
            </h2>
            <div className="!w-full !h-1 !bg-white !mt-2"></div>
          </div>
        </div>

        <div className="!p-6 !bg-white">
          <div className="!text-center !mb-6">
            <p className="!text-black !font-bold !text-sm !uppercase !tracking-wide !border-2 !border-black !inline-block !px-3 !py-1 !bg-gray-100">
              NHẬP MÃ OTP
            </p>
          </div>

          <form className="!space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="!block !text-xs !font-black !text-black !mb-3 !uppercase !tracking-wider">
                MÃ XÁC THỰC
              </label>
              <div className="!grid !grid-cols-6 !gap-2">
                {Array(6).fill(0).map((_, index) => (
                  <div key={index} className="!relative">
                    <input
                      type="text"
                      maxLength={1}
                      pattern="[0-9]"
                      inputMode="numeric"
                      className="!w-full !aspect-square !text-center !text-2xl !font-black !border-4 !border-black !bg-white !focus:bg-yellow-100 !focus:outline-none !transition-all !duration-200 !transform !focus:scale-110 !focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value) {
                          const newOtp = otp.split('');
                          newOtp[index] = value;
                          setOtp(newOtp.join(''));
                          // Auto-focus next input
                          if (index < 5 && value) {
                            const nextInput = document.querySelector(`input[name=otp-${index + 1}]`) as HTMLInputElement;
                            if (nextInput) nextInput.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace to go to previous input
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          const prevInput = document.querySelector(`input[name=otp-${index - 1}]`) as HTMLInputElement;
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      name={`otp-${index}`}
                      aria-label={`Digit ${index + 1} of OTP`}
                    />
                    {/* Manga-style speed lines effect when focused */}
                    <div className="!absolute !inset-0 !pointer-events-none !opacity-0 !focus-within:opacity-100 !transition-opacity">
                      <div className="!absolute !top-0 !left-1/2 !w-px !h-2 !bg-black !transform !-translate-x-1/2 !-translate-y-full"></div>
                      <div className="!absolute !bottom-0 !left-1/2 !w-px !h-2 !bg-black !transform !-translate-x-1/2 !translate-y-full"></div>
                      <div className="!absolute !left-0 !top-1/2 !w-2 !h-px !bg-black !transform !-translate-y-1/2 !-translate-x-full"></div>
                      <div className="!absolute !right-0 !top-1/2 !w-2 !h-px !bg-black !transform !-translate-y-1/2 !translate-x-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="!relative">
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="!w-full !py-4 !px-6 !bg-black !text-white !font-black !text-lg !uppercase !tracking-wider !border-4 !border-black !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] !transition-all !duration-200 !transform !hover:-translate-x-1 !hover:-translate-y-1 !hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] !active:translate-x-0 !active:translate-y-0 !active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] !disabled:opacity-50 !disabled:cursor-not-allowed !disabled:transform-none !disabled:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] !relative !overflow-hidden"
              >
                {/* Manga-style action lines background */}
                <div className="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-white !to-transparent !opacity-10 !transform !-skew-x-12 !translate-x-full !group-hover:translate-x-[-100%] !transition-transform !duration-500"></div>
                
                <span className="!relative !z-10">
                  {isLoading ? (
                    <div className="!flex !items-center !justify-center">
                      <div className="!w-6 !h-6 !border-4 !border-white !border-t-transparent !rounded-full !animate-spin !mr-3"></div>
                      ĐANG XỬ LÝ...
                    </div>
                  ) : 'XÁC THỰC!'}
                </span>
                
                {/* Manga-style emphasis marks */}
                {!isLoading && (
                  <>
                    <div className="!absolute !top-2 !right-2 !text-xs !font-black">!</div>
                    <div className="!absolute !bottom-2 !left-2 !text-xs !font-black">!</div>
                  </>
                )}
              </button>
            </div>
          </form>

          {message && (
            <div className="!mt-6">
              <div className={`!p-4 !border-4 !border-black !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] !relative !overflow-hidden ${
                message.includes('thành công') 
                  ? '!bg-white' 
                  : '!bg-white'
              }`}>
                {/* Manga-style background pattern */}
                <div className="!absolute !inset-0 !opacity-5">
                  <div className="!w-full !h-full !bg-gradient-to-br !from-black !via-transparent !to-black"></div>
                </div>
                
                <div className="!flex !items-center !relative !z-10">
                  <div className={`!flex-shrink-0 !w-10 !h-10 !border-4 !border-black !flex !items-center !justify-center !font-black !text-xl ${
                    message.includes('thành công') ? '!bg-white !text-black' : '!bg-black !text-white'
                  }`}>
                    {message.includes('thành công') ? '✓' : '✗'}
                  </div>
                  <div className="!ml-4">
                    <p className="!text-black !font-bold !uppercase !tracking-wide !text-sm">
                      {message}
                    </p>
                  </div>
                </div>
                
                {/* Manga-style speed lines */}
                <div className="!absolute !top-0 !right-0 !w-full !h-full !pointer-events-none">
                  <div className="!absolute !top-2 !right-2 !w-8 !h-px !bg-black !transform !rotate-45"></div>
                  <div className="!absolute !top-4 !right-4 !w-6 !h-px !bg-black !transform !rotate-45"></div>
                  <div className="!absolute !bottom-2 !left-2 !w-8 !h-px !bg-black !transform !-rotate-45"></div>
                  <div className="!absolute !bottom-4 !left-4 !w-6 !h-px !bg-black !transform !-rotate-45"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Manga-style footer accent */}
        <div className="!bg-black !h-2"></div>
      </div>
    </div>
  );
};

export default Checkotp;
