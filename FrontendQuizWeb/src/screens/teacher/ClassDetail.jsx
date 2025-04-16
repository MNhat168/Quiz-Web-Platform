import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
    BookOpen,
    Users,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    RefreshCw,
    Calendar,
    Clock,
    User,
    Trophy
} from "lucide-react";
import Sidebar from "../../layout/teacher/teacherHeader";
import "../../style/teacher-class-detail.css";

const ClassDetail = () => {
    const { classId } = useParams();
    const { token, role } = useAuth();
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [classCode, setClassCode] = useState("");
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("students"); // students, attendance, quiz
    const [leaderboardData, setLeaderboardData] = useState([]);

    // Fetch class details
    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:8080/api/classes/${classId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setClassData(response.data);

                // Fetch students if there are any
                if (response.data.studentIds && response.data.studentIds.length > 0) {
                    const studentsData = await Promise.all(
                        response.data.studentIds.map(async (studentId) => {
                            try {
                                // Use the correct endpoint to fetch user data
                                const studentResponse = await axios.get(`http://localhost:8080/api/classes/user/${studentId}`, {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                });
                                return studentResponse.data;
                            } catch (err) {
                                console.error(`Failed to fetch student with ID: ${studentId}`, err);
                                return { id: studentId, name: "Unknown Student", email: "" };
                            }
                        })
                    );
                    setStudents(studentsData);

                    // Also use the student data for the leaderboard (for demonstration)
                    // In a real application, you would fetch actual leaderboard data
                    const leaderboard = studentsData
                        .map(student => ({
                            id: student.id,
                            name: student.name || student.username || "Unknown",
                            points: Math.floor(Math.random() * 3000),
                            country: "US"
                        }))
                        .sort((a, b) => b.points - a.points)
                        .slice(0, 4);

                    setLeaderboardData(leaderboard);
                }
            } catch (err) {
                console.error("Failed to fetch class details", err);
                setError("Failed to load class details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchClassDetails();
    }, [classId, token]);

    const generateNewCode = async () => {
        try {
            const response = await axios.post(
                `http://localhost:8080/api/classes/${classId}/generate-code`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setClassCode(response.data.classCode);
            setIsCodeVisible(true);
            setSuccessMessage("New class code generated successfully!");

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
        } catch (err) {
            console.error("Failed to generate new code", err);
            setError("Failed to generate new class code. Please try again.");

            // Clear error message after 3 seconds
            setTimeout(() => {
                setError("");
            }, 3000);
        }
    };

    const toggleShowCode = async () => {
        if (classCode && isCodeVisible) {
            setIsCodeVisible(false);
            return;
        }

        if (classCode) {
            setIsCodeVisible(true);
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8080/api/classes/${classId}/generate-code`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setClassCode(response.data.classCode);
            setIsCodeVisible(true);
        } catch (err) {
            console.error("Failed to get class code", err);
            setError("Failed to retrieve class code. Please try again.");
        }
    };

    const removeStudent = async (studentId) => {
        try {
            await axios.delete(
                `http://localhost:8080/api/classes/${classId}/students/${studentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Update local state to remove student
            setStudents(students.filter(student => student.id !== studentId));
            setClassData({
                ...classData,
                studentIds: classData.studentIds.filter(id => id !== studentId)
            });

            setSuccessMessage("Student removed successfully!");

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
        } catch (err) {
            console.error("Failed to remove student", err);
            setError("Failed to remove student. Please try again.");

            // Clear error message after 3 seconds
            setTimeout(() => {
                setError("");
            }, 3000);
        }
    };

    const markAttendance = () => {
        // This would be implemented to mark attendance for the class
        alert("Attendance marking feature would be implemented here");
    };

    if (loading) {
        return (
            <>
                <Sidebar />
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
            </>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <>
        <header className="dashboard-header">
            <div className="header-left">
            <div className="logo-container">
                <div className="logo-circle">Q</div>
                <span className="logo-text">uiz</span>
            </div>
            <div className="teacher-badge">TEACHER</div>
            <h1 className="header-title">Dashboard</h1>
            </div>
            <div className="header-right">
            <div className="notification-icon">
                <i className="icon-bell"></i>
            </div>
            <div className="user-profile">
                <span className="user-name">LuxyAnna</span>
                <span className="user-role">Teacher</span>
                <div className="avatar">
                <span>L</span>
                </div>
                <i className="icon-chevron-down"></i>
            </div>
            </div>
        </header>
        <div className="app-container">
            <Sidebar />
            <div className="main-content">

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-md mb-6 shadow-sm">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p>{successMessage}</p>
                        </div>
                    </div>
                )}

                <div className="bg-blue-500 rounded-xl text-white p-6">
                <div className="class-card-container">
                    <div className="class-card-custome">
                    {/* Left: Class Info */}
                    <div className="class-info">
                        <h1 className="class-title">{classData?.name || "Class"}</h1>
                        <div className="class-date">
                        <Calendar className="icon" />
                        <span>{classData?.createdAt ? formatDate(classData.createdAt) : "No date available"}</span>
                        </div>

                        {/* Actions */}
                        <div className="class-actions">
                        <button onClick={toggleShowCode} className="code-toggle-btn">
                            {isCodeVisible ? (
                            <>
                                <EyeOff className="icon" />
                                Hide Code
                            </>
                            ) : (
                            <>
                                <Eye className="icon" />
                                Show Code
                            </>
                            )}
                        </button>

                        <button onClick={markAttendance} className="attendance-btn">
                            <CheckCircle className="icon" />
                            Mark Attendance
                        </button>
                        </div>

                        {/* Class Code */}
                        {isCodeVisible && (
                        <div className="class-code-box">
                            <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">Class Code:</span>
                            <span className="font-mono bg-white/20 px-2 py-1 rounded text-sm">{classCode}</span>
                            </div>
                            <button
                            onClick={generateNewCode}
                            className="text-xs bg-white/10 hover:bg-white/20 rounded-md px-2 py-1 flex items-center"
                            >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            New Code
                            </button>
                        </div>
                        )}
                    </div>

                    {/* Right: Tutor Info */}
                    <div className="tutor-section">
                        <div className="tutor-header">
                        <h3 className="tutor-title">Tutors</h3>
                        <span className="status-badge">In Progress</span>
                        </div>
                        <div className="tutor-box">
                        <div className="tutor-left">
                            <img src={`/api/placeholder/40/40`} alt="Tutor" className="tutor-avatar" />
                            <div>
                            <div className="tutor-name">Teacher Name</div>
                            <div className="tutor-role">Lead Tutor</div>
                            </div>
                        </div>
                        <div className="tutor-indicator" />
                        </div>
                        {/* Members */}
                        <div className="members-section">
                            <span className="text-sm font-medium">Members</span>
                            <button className="invite-btn">Invite</button>
                            <div className="avatar-group">
                                {students.slice(0, 5).map((student, index) => (
                                <div
                                    key={index}
                                    className={`avatar-circle bg-${['orange', 'green', 'purple', 'red', 'blue'][index % 5]}-400`}
                                >
                                    {student.name
                                    ? `${student.name.charAt(0)}${student.name.split(' ')[1]?.charAt(0) || ''}`
                                    : 'U'}
                                </div>
                                ))}
                                {students.length > 5 && (
                                <div className="avatar-circle bg-blue-500 text-white border-white">+{students.length - 5}</div>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                <div className="class-page">
                <div className="main-content-custome">
                    <div className="tab-nav">
                    <nav className="tab-buttons">
                        <button
                        className={`tab-button ${activeTab === "students" ? "active" : ""}`}
                        onClick={() => setActiveTab("students")}
                        >
                        Students
                        </button>
                        <button
                        className={`tab-button ${activeTab === "attendance" ? "active" : ""}`}
                        onClick={() => setActiveTab("attendance")}
                        >
                        Attendance
                        </button>
                        <button
                        className={`tab-button ${activeTab === "quiz" ? "active" : ""}`}
                        onClick={() => setActiveTab("quiz")}
                        >
                        Quiz
                        </button>
                    </nav>
                    </div>

                    <div className="tab-content">
                    {activeTab === "students" && (
                        <div>
                        {students.length > 0 ? (
                            <table className="student-table">
                            <thead>
                                <tr>
                                <th>Name/Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => (
                                <tr key={index}>
                                    <td>
                                    <div className="student-info">
                                        <img src="/api/placeholder/40/40" alt="Student" className="avatar" />
                                        <div>
                                        <div className="student-name">{student.name || student.username}</div>
                                        <div className="student-email">{student.email}</div>
                                        </div>
                                    </div>
                                    </td>
                                    <td>
                                    <span className="status-badge">{student.status || "Active"}</span>
                                    </td>
                                    <td>
                                    <button onClick={() => removeStudent(student.id)} className="remove-button">
                                        Remove
                                    </button>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        ) : (
                            <div className="empty-message">No students have joined this class yet.</div>
                        )}
                        </div>
                    )}

                    {activeTab === "attendance" && (
                        <div>
                        <div className="tab-header">
                            <h3>Attendance History</h3>
                            <button className="action-button">Take Attendance</button>
                        </div>
                        <div className="empty-message">Attendance reports will be shown here</div>
                        </div>
                    )}

                    {activeTab === "quiz" && (
                        <div>
                        <div className="tab-header">
                            <h3>Quiz Management</h3>
                            <button className="action-button">Create Quiz</button>
                        </div>
                        <div className="empty-message">No quizzes have been created for this class yet</div>
                        </div>
                    )}
                    </div>
                </div>

                <div className="leaderboard-container">
                    <h3 className="leaderboard-title">Leaderboard</h3>
                    <div className="leaderboard-card">
                    <div className="leaderboard-tabs">
                        <button className="leaderboard-tab active">Weekly</button>
                        <button className="leaderboard-tab">All Time</button>
                    </div>
                    <div className="leaderboard-list">
                        {leaderboardData.length > 0 ? (
                        leaderboardData.map((student, index) => (
                            <div key={index} className="leaderboard-item">
                            <div className="leaderboard-rank">
                                <div className="rank-circle">{index + 1}</div>
                                <img src="/api/placeholder/32/32" alt={student.name} className="avatar-small" />
                                <div>
                                <div className="student-name">{student.name}</div>
                                <div className="student-email">{student.points} points</div>
                                </div>
                            </div>
                            <div className="leaderboard-icon">
                                {index === 0 && <div className="gold"><Trophy className="icon" /></div>}
                                {index === 1 && <div className="silver"><Trophy className="icon" /></div>}
                                {index === 2 && <div className="bronze"><Trophy className="icon" /></div>}
                            </div>
                            </div>
                        ))
                        ) : (
                        <div className="empty-message">No leaderboard data available</div>
                        )}
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default ClassDetail;