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
        <div className="!min-h-screen !w-screen !flex !items-center !justify-center !relative !bg-gray-900 !overflow-hidden">
            {/* Spline Background with your custom light and strings */}
            <div className="!fixed !inset-0 ">
                <iframe
                    src="https://my.spline.design/untitled-FbbF2ZO7RTADdkdKK4lNGxa8/"
                    frameBorder="0"
                    width="100%"
                    height="100%"
                    className="!w-full !h-full"
                ></iframe>
            </div>
            
            {/* Content above Spline */}
            <div className="!relative !z-10 !w-full !max-w-5xl !px-8 !flex  !my-12 !ml-20 !mt-40 right-65">
                {/* Main content container */}
                <div className="!bg-white/10 !border !border-white/20 !rounded-md !p-8 !w-full !shadow-lg !relative">
                    {/* Header with title and buttons */}
                    <div className="!flex !justify-between !items-center !mb-8 !relative">
                        <h1 className="!text-5xl !font-bold !text-amber-100 !leading-tight !font-serif !flex !items-center">
                            <span className="!bg-red-900/50 !px-4 !py-2 !border !border-red-800/30 !text-4xl"> PROFILE</span>
                        </h1>
                        
                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="!px-6 !py-3 !bg-amber-900/70 !text-amber-100 !rounded-sm !hover:bg-amber-800/40 !transition-colors !font-mono !text-base !border !border-amber-800/30"
                            >
                                EDIT FILE
                            </button>
                        ) : (
                            <div className="!space-x-3 !flex">
                                <button
                                    onClick={handleSave}
                                    className="!px-6 !py-3 !bg-emerald-900/40 !text-emerald-100 !rounded-sm !hover:bg-emerald-800/40 !transition-colors !font-mono !text-base !border !border-emerald-800/30"
                                >
                                    SAVE
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="!px-6 !py-3 !bg-red-900/40 !text-red-100 !rounded-sm !hover:bg-red-800/40 !transition-colors !font-mono !text-base !border !border-red-800/30"
                                >
                                    CANCEL
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Main content grid */}
                    <div className="!grid !grid-cols-3 !gap-6 !relative">
                        {/* Personal Information */}
                        <div className="!col-span-1 !bg-amber-950/70 !p-6 !rounded-sm !shadow-md !border !border-amber-800/20 !transform !rotate-[-1deg] !hover:rotate-0 !transition-transform">
                            <div className="!absolute !top-[-5px] !left-[10px] !w-4 !h-4 !rounded-full !bg-red-600/60"></div>
                            <div className="!absolute !top-[-5px] !right-[10px] !w-4 !h-4 !rounded-full !bg-amber-600/60"></div>
                            
                            <h2 className="!text-xl !font-mono !text-amber-100 !mb-4 !uppercase !border-b !border-amber-800/20 !pb-2">
                                Personal Information
                            </h2>
                            
                            <div className="!space-y-4 !font-mono">
                                <div>
                                    <p className="!text-amber-200/80 !text-sm !uppercase">Display Name</p>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={editedProfile?.displayName || ''}
                                            onChange={handleInputChange}
                                            className="!w-full !bg-amber-950/50 !text-amber-100 !rounded-none !border !border-amber-800/30 !px-3 !py-2 !mt-1 !font-mono !text-base"
                                        />
                                    ) : (
                                        <p className="!text-amber-100 !font-bold !text-lg">{profile?.displayName || 'REDACTED'}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <p className="!text-amber-200/80 !text-sm !uppercase">Username</p>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="username"
                                            value={editedProfile?.username || ''}
                                            onChange={handleInputChange}
                                            className="!w-full !bg-amber-950/50 !text-amber-100 !rounded-none !border !border-amber-800/30 !px-3 !py-2 !mt-1 !font-mono !text-base"
                                        />
                                    ) : (
                                        <p className="!text-amber-100 !font-bold !text-lg">{profile?.username || 'UNKNOWN'}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <p className="!text-amber-200/80 !text-sm !uppercase">Email</p>
                                    <p className="!text-amber-100 !font-bold !text-lg">{profile?.email || 'CLASSIFIED'}</p>
                                </div>
                            </div>
                            
                            {/* Stamp */}
                            <div className="!absolute !bottom-3 !right-3 !transform !rotate-[-15deg] !text-red-500 !border-2 !border-red-600/30 !rounded-sm !px-2 !py-1 !text-sm !font-bold !opacity-80">
                                CONFIDENTIAL
                            </div>
                        </div>
                        
                        {/* Account Info */}
                        <div className="!col-span-1 !bg-amber-950/70 !p-6 !rounded-sm !shadow-md !border !border-amber-800/20 !transform !rotate-[1deg] !hover:rotate-0 !transition-transform">
                            <div className="!absolute !top-[-5px] !left-[10px] !w-4 !h-4 !rounded-full !bg-blue-600/60"></div>
                            <div className="!absolute !top-[-5px] !right-[10px] !w-4 !h-4 !rounded-full !bg-emerald-600/60"></div>
                            
                            <h2 className="!text-xl !font-serif !text-amber-100 !mb-4 !uppercase !border-b !border-amber-800/20 !pb-2">
                                Account Details
                            </h2>
                            
                            <div className="!space-y-4 !font-serif">
                                <div>
                                    <p className="!text-amber-200/80 !text-base">Role:</p>
                                    <div className="!flex !items-center">
                                        <p className="!text-amber-100 !text-xl !font-bold">{profile?.role || 'UNKNOWN'}</p>
                                        {profile?.role === 'ADMIN' && (
                                            <div className="!ml-3 !px-3 !py-1 !bg-red-900/40 !text-red-100 !text-sm !font-bold !rotate-[-5deg] !border !border-red-800/30">
                                                HIGH CLEARANCE
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="!text-amber-200/80 !text-base">Status:</p>
                                    <p className="!text-emerald-300 !font-bold !text-lg">ACTIVE</p>
                                </div>
                                
                               
                            </div>
                            
                            {/* Handwritten note */}
                            <div className="!absolute !bottom-3 !right-3 !transform !rotate-[-20deg] !text-blue-300 !font-serif !text-sm !italic">
                                Check background!
                            </div>
                        </div>
                        
                        {/* Photo and Evidence */}
                        <div className="!col-span-1 !bg-amber-950/70 !p-6 !rounded-sm !shadow-md !border !border-amber-800/20 !transform !rotate-[-1deg] !hover:rotate-0 !transition-transform">
                            <div className="!absolute !top-[-5px] !left-[10px] !w-4 !h-4 !rounded-full !bg-yellow-600/60"></div>
                            <div className="!absolute !top-[-5px] !right-[10px] !w-4 !h-4 !rounded-full !bg-red-600/60"></div>
                            
                            <h2 className="!text-xl !font-mono !text-amber-100 !mb-4 !uppercase !border-b !border-amber-800/20 !pb-2">
                                Personal Photo
                            </h2>
                            
                            <div 
                                className="!relative !group !cursor-pointer !mb-4"
                                onClick={handleAvatarClick}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleAvatarClick();
                                    }
                                }}
                            >
                                <div className="!bg-amber-950/50 !p-2 !mb-2">
                                    <img 
                                        src={profile?.avatarUrl || 'https://via.placeholder.com/150'} 
                                        alt="Profile" 
                                        className="!w-full !h-40 !object-cover"
                                    />
                                </div>
                                
                                <div className="!absolute !inset-0 !flex !items-center !justify-center !bg-amber-950/50 !opacity-0 !group-hover:opacity-100 !transition-opacity">
                                    <span className="!text-amber-100 !text-sm !font-mono !bg-amber-950/60 !p-2">CHANGE PHOTO</span>
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
                                <div className="!absolute !inset-0 !flex !items-center !justify-center !bg-amber-950/50">
                                    <div className="!text-amber-100 !flex !flex-col !items-center">
                                        <div className="!animate-spin !rounded-full !h-8 !w-8 !border-b-2 !border-amber-100 !mb-2"></div>
                                        <span className="!font-mono !text-sm">UPLOADING...</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="!font-mono !text-sm !text-amber-200/80 !space-y-2">
                                <div className="!flex !justify-between">
                                    <span>PERSONAL ID:</span>
                                    <span className="!font-bold !text-amber-100 !text-base">{profile?.username?.toUpperCase() || 'UNKNOWN'}</span>
                                </div>
                                <div className="!flex !justify-between">
                                    <span>DATE:</span>
                                    <span className="!text-amber-100 !text-base">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Notes section - small post-it */}
                    <div className="!absolute !top-20 !right-[-80px] !w-40 !h-40 !bg-amber-200/70 !p-4 !shadow-md !transform !rotate-6 !z-20 !font-serif !text-sm !hover:rotate-0 !transition-transform">
                        <p className="!text-amber-900 !text-base">Check connections to previous cases. Possible pattern.</p>
                        <p className="!mt-3 !text-amber-800 !text-sm">- Detective</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Info; 