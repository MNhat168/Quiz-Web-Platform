import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../style/student-join-class.css';

const StudentJoinClass = () => {
    const { token } = useAuth();
    const [classCode, setClassCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Generate a random color class for class cards
    const getRandomColorClass = (index) => {
        const colors = ['gradient-violet', 'gradient-fuchsia', 'gradient-blue', 'gradient-pink', 'gradient-indigo', 'gradient-purple'];
        return colors[index % colors.length];
    };

    // Fetch student's enrolled classes
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8080/api/classes/student', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Ensure response data is an array
                const classesData = Array.isArray(response.data) ? response.data : [];
                setEnrolledClasses(classesData);

            } catch (err) {
                console.error('Failed to fetch enrolled classes', err);
                setError('Failed to load your classes. Please try again later.');
                setEnrolledClasses([]); // Reset to empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [token, successMessage]); // Refetch when a new class is joined successfully

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        if (!classCode.trim()) {
            setError('Class code is required');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/classes/join', {
                classCode: classCode
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setClassCode('');
            setSuccessMessage(response.data);

        } catch (err) {
            console.error('Failed to join class', err);
            setError(err.response?.data || 'Failed to join class. Please check your class code and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const viewClassDetails = (classId) => {
        navigate(`/classes/${classId}`);
    };

    return (
        <div className="student-page">
            <div className="container">
                {/* Decorative elements */}
                <div className="decorative-circle top-right purple"></div>
                <div className="decorative-circle bottom-left purple"></div>

                <div className="content-wrapper">
                    <div className="page-header">
                        <div className="icon-container purple">
                            <i className="icon book-open"></i>
                        </div>
                        <div className="header-text">
                            <h1 className="page-title gradient-text-purple">Join a Class</h1>
                            <p className="subtitle">Enter a class code or view your enrolled classes</p>
                        </div>
                    </div>

                    {error && (
                        <div className="alert error fade-in">
                            <i className="icon alert-circle"></i>
                            <p>{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="alert success purple fade-in">
                            <i className="icon sparkles"></i>
                            <p>{successMessage}</p>
                        </div>
                    )}

                    <div className="two-column-grid">
                        {/* Join Class Form */}
                        <div className="card hover-shadow purple-border">
                            <div className="card-header">
                                <div className="icon-container small purple">
                                    <i className="icon log-in"></i>
                                </div>
                                <h2 className="card-title gradient-text-purple">Enter Class Code</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="form">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="classCode">
                                        Class Code*
                                    </label>
                                    <div className="input-wrapper code-input-wrapper">
                                        <input
                                            type="text"
                                            id="classCode"
                                            className="form-input code-input"
                                            value={classCode}
                                            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                                            placeholder="XXXXXX"
                                            maxLength={6}
                                            required
                                        />
                                        <div className="input-glow purple"></div>
                                    </div>
                                    <p className="input-help-text">
                                        Enter the 6-character code provided by your teacher
                                    </p>
                                </div>

                                <div className="form-group">
                                    <button
                                        type="submit"
                                        className="button primary purple full-width"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner purple"></span>
                                                Joining...
                                            </>
                                        ) : (
                                            <>
                                                <i className="icon log-in"></i>
                                                Join Class
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Enrolled Classes List */}
                        <div className="card hover-shadow purple-border">
                            <div className="card-header">
                                <div className="icon-container small purple">
                                    <i className="icon book-open"></i>
                                </div>
                                <h2 className="card-title gradient-text-purple">Your Enrolled Classes</h2>
                            </div>

                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner-container purple">
                                        <div className="spinner-outer"></div>
                                        <div className="spinner-inner"></div>
                                    </div>
                                </div>
                            ) : enrolledClasses.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon-container">
                                        <i className="icon book-open empty-icon"></i>
                                        <div className="empty-icon-badge">
                                            <i className="icon log-in"></i>
                                        </div>
                                    </div>
                                    <p className="empty-title">You're not enrolled in any classes yet.</p>
                                    <p className="empty-subtitle">Enter a class code to join your first class</p>
                                </div>
                            ) : (
                                <div className="class-list">
                                    {enrolledClasses.map((cls, index) => (
                                        <div
                                            key={cls.id}
                                            className={`class-card ${getRandomColorClass(index)}`}
                                        >
                                            {/* Pattern overlay */}
                                            <div className="pattern-overlay"></div>

                                            <div className="class-card-content">
                                                <div className="class-card-header">
                                                    <div>
                                                        <h3 className="class-name">{cls.name}</h3>
                                                        {cls.description && <p className="class-description">{cls.description}</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => viewClassDetails(cls.id)}
                                                        className="button small light"
                                                    >
                                                        View Class
                                                        <i className="icon chevron-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentJoinClass;
