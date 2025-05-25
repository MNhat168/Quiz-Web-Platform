import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleCancel = () => {
        navigate('/student');
    };

    return (
        <div className="!min-h-screen !w-screen !flex !items-center !justify-start !relative">
            {/* Spline Background */}
            <div className="!fixed !inset-0 !z-0">
                <iframe
                    src="https://my.spline.design/assemblyline-cDKWMqbwtGLBI9wDd9vUpU17/"
                    frameBorder="0"
                    width="100%"
                    height="100%"
                    className="!w-full !h-full"
                ></iframe>
                {/* Dark overlay */}
                <div className="!absolute !inset-0 !bg-black !opacity-25"></div>
            </div>
            {/* Content always above Spline */}
            <div className="!relative !z-10 !max-w-2xl !w-full !px-8 !text-left !ml-20">
                <div className="!animate-fade-in">
                    <h1 className="!text-4xl !md:text-5xl !font-bold !text-white !mb-8 !leading-tight">
                        Are you sure you want to log out?
                    </h1>
                    <p className="!text-white !font-semibold !text-lg !mb-12 !leading-relaxed">
                        You will need to log in again to access your account. This is a security measure to protect your personal information and ensure your account remains secure. When you log back in, you'll have full access to all your quizzes, progress, and learning materials.
                    </p>
                    <div className="!flex !gap-4">
                        <button
                            className="!bg-red-500 !text-white !px-8 !py-4 !rounded-full !font-medium !hover:bg-gray-800 !transition-colors !duration-300 !transform !hover:scale-105"
                            onClick={handleLogout}
                        >
                            Yes, log me out
                        </button>
                        <button
                            className="!bg-transparent !text-white !border-2 !border-white !px-8 !py-4 !rounded-full !font-medium !hover:bg-white !hover:bg-opacity-10 !transition-colors !duration-300 !transform !hover:scale-105"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Logout; 