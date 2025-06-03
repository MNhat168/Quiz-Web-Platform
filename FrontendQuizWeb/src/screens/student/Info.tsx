import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// Create a new axios instance for file uploads
const uploadAxios = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
        'Accept': 'application/json',
    }
});

interface UserProfile {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    classIds: string[] | null;
}

const Info: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/user/detailed-info');
                console.log('Profile Response:', response.data);
                setProfile(response.data);
                setEditedProfile(response.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile information');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedProfile(profile);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedProfile(profile);
    };

    const handleSave = async () => {
        try {
            const response = await axios.put('http://localhost:8080/api/user/update-profile', {
                displayName: editedProfile?.displayName,
                username: editedProfile?.username
            });
            setProfile(response.data);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
        }
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setError(null);

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to upload avatar');
            setUploadingAvatar(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await uploadAxios.post(
                '/api/user/avatar',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data) {
                setProfile(response.data);
                setEditedProfile(response.data);
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data || 'Upload failed');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editedProfile) {
            setEditedProfile({
                ...editedProfile,
                [e.target.name]: e.target.value
            });
        }
    };

    if (loading) {
        return (
            <div className="!min-h-screen !w-screen !flex !items-center !justify-center !bg-gray-900">
                <div className="!text-white !text-xl">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="!min-h-screen !w-screen !flex !items-center !justify-center !bg-gray-900">
                <div className="!text-red-500 !text-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="!min-h-screen !w-screen !flex !items-center !justify-start !relative !bg-gray-900">
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
                <div className="!absolute !inset-0 !bg-black !opacity-70"></div>
            </div>
            {/* Content always above Spline */}
            <div className="!relative !z-10 !max-w-4xl !w-full !px-8 !text-left !ml-20">
                <div className="!animate-fade-in">
                    <div className="!flex !justify-between !items-center !mb-8">
                        <h1 className="!text-4xl !md:text-5xl !font-bold !text-white !leading-tight">
                            Student Profile
                        </h1>
                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="!px-4 !py-2 !bg-blue-600 !text-white !rounded-lg !hover:bg-blue-700 !transition-colors"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div className="!space-x-2">
                                <button
                                    onClick={handleSave}
                                    className="!px-4 !py-2 !bg-green-600 !text-white !rounded-lg !hover:bg-green-700 !transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="!px-4 !py-2 !bg-gray-600 !text-white !rounded-lg !hover:bg-gray-700 !transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="!bg-gray-800 !bg-opacity-50 !p-8 !rounded-2xl !backdrop-blur-sm !border !border-gray-700">
                        <div className="!grid !grid-cols-2 !gap-8">
                            <div>
                                <h2 className="!text-2xl !font-semibold !text-white !mb-4">Personal Information</h2>
                                <div className="!space-y-4">
                                    <div>
                                        <p className="!text-gray-400 !text-sm">Display Name</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="displayName"
                                                value={editedProfile?.displayName || ''}
                                                onChange={handleInputChange}
                                                className="!w-full !bg-gray-700 !text-white !rounded-lg !px-3 !py-2 !mt-1"
                                            />
                                        ) : (
                                            <p className="!text-white !text-lg !font-medium">{profile?.displayName || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="!text-gray-400 !text-sm">Username</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="username"
                                                value={editedProfile?.username || ''}
                                                onChange={handleInputChange}
                                                className="!w-full !bg-gray-700 !text-white !rounded-lg !px-3 !py-2 !mt-1"
                                            />
                                        ) : (
                                            <p className="!text-white !text-lg !font-medium">{profile?.username || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="!text-gray-400 !text-sm">Email</p>
                                        <p className="!text-white !text-lg !font-medium">{profile?.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="!flex !flex-col !justify-center !items-center">
                                <h2 className="!text-2xl !font-semibold !text-white !mb-4">Account</h2>
                                <div className="!space-y-4 !w-full !flex !flex-col !items-center">
                                    <div>
                                        <p className="!text-gray-400 !text-sm">Role</p>
                                        <p className="!text-white !text-lg !font-medium">{profile?.role || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="!mt-8 !flex !justify-center !relative">
                            <div 
                                className="!relative !group !cursor-pointer"
                                onClick={handleAvatarClick}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleAvatarClick();
                                    }
                                }}
                            >
                                <img 
                                    src={profile?.avatarUrl || 'https://via.placeholder.com/150'} 
                                    alt="Profile" 
                                    className="!w-32 !h-32 !rounded-full !object-cover !border-4 !border-gray-700"
                                />
                                <div className="!absolute !inset-0 !flex !items-center !justify-center !bg-black !bg-opacity-50 !rounded-full !opacity-0 !group-hover:opacity-100 !transition-opacity">
                                    <span className="!text-white !text-sm">Click to Change Avatar</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/jpeg,image/png,image/gif"
                                className="!hidden"
                            />
                            {uploadingAvatar && (
                                <div className="!absolute !inset-0 !flex !items-center !justify-center !bg-black !bg-opacity-50 !rounded-full">
                                    <div className="!text-white !flex !flex-col !items-center">
                                        <div className="!animate-spin !rounded-full !h-8 !w-8 !border-b-2 !border-white !mb-2"></div>
                                        <span>Uploading...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Info; 