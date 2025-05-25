import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    Trophy,
    PlayCircle
} from "lucide-react";
import Sidebar from "../../layout/teacher/teacherSidebar";
import "../../style/teacher-class-detail.css";
import Header from "../../layout/teacher/teacherHeader";

const ClassDetail = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
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
    const [availableGames, setAvailableGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState("");
    const [gameLoading, setGameLoading] = useState(false);
    const [gameSessions, setGameSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [subjectProgress, setSubjectProgress] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(false);

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

    // Fetch available games when the quiz tab is active
    useEffect(() => {
        if (activeTab === "quiz") {
            fetchAvailableGames();
        }
    }, [activeTab, token]);

    const fetchAvailableGames = async () => {
        try {
            setGameLoading(true);
            const teacherId = getTeacherId();

            if (!teacherId) {
                throw new Error("Could not determine teacher ID from token");
            }

            const response = await axios.get('http://localhost:8080/api/games/teacher', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Teacher-Id': teacherId
                }
            });

            setAvailableGames(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch games", err);
            setError("Failed to load available games. Please try again later.");
        } finally {
            setGameLoading(false);
        }
    };

    // Extract teacher ID from token
    const getTeacherId = () => {
        try {
            return JSON.parse(atob(token.split(".")[1])).sub;
        } catch (e) {
            console.error("Failed to extract teacher ID from token:", e);
            return null;
        }
    };

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

    useEffect(() => {
    const fetchAllGameSessionsWithGameNames = async () => {
        setLoading(true);
        try {
        const sessionRes = await axios.post(
            `http://localhost:8080/api/classes/${classId}/game-session`,
            {},
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );

        const sessions = Array.isArray(sessionRes.data) ? sessionRes.data : [];

        const sessionsWithGameNames = await Promise.all(
            sessions.map(async (session) => {
            try {
                const gameRes = await axios.get(
                `http://localhost:8080/api/games/${session.gameId}`,
                {
                    headers: {
                    Authorization: `Bearer ${token}`,
                    },
                }
                );
                return {
                ...session,
                gameName: gameRes.data.title || "No Name",
                };
            } catch (error) {
                console.warn(`Không lấy được gameId ${session.gameId}:`, error);
                return {
                ...session,
                gameName: "Không truy cập được",
                };
            }
            })
        );

        setGameSessions(sessionsWithGameNames);
        } catch (error) {
        console.error("Lỗi khi tải game sessions:", error);
        setError("Không thể tải danh sách sessions.");
        } finally {
        setLoading(false);
        }
    };

    if (classId && token) {
        fetchAllGameSessionsWithGameNames();
    }
    }, [classId, token]);

    const handleSelectSession = async (session) => {
        setSelectedSession(session);
        setLoadingHistory(true);
        setLoadingProgress(true); // nếu muốn có loading riêng cho progress

        try {
            // Gọi API lịch sử lớp
            const historyRes = await axios.get(
            `http://localhost:8080/api/classes/class-game-history/${session.id}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
            );
            setSelectedHistory(historyRes.data);

            // Gọi API tiến độ môn học
            const progressRes = await axios.get(
            `http://localhost:8080/api/classes/subject-progress/${session.id}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
            );
            setSubjectProgress(progressRes.data);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu:", err);
            setSelectedHistory(null);
            setSubjectProgress(null);
        } finally {
            setLoadingHistory(false);
            setLoadingProgress(false);
        }
    };

    const ITEMS_PER_PAGE = 9;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(gameSessions.length / ITEMS_PER_PAGE);

    const paginatedSessions = gameSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
    );

    const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'  // hoặc bỏ nếu muốn giờ địa phương
    }).format(date);
    };

    const markAttendance = () => {
        // This would be implemented to mark attendance for the class
        alert("Attendance marking feature would be implemented here");
    };

    // Update the createGameSession function to navigate with parameters instead of API call
    const createGameSession = async () => {
        if (!selectedGame) {
            setError("Please select a game first");
            setTimeout(() => {
                setError("");
            }, 3000);
            return;
        }

        // Navigate to TeacherCreateRoom with gameId and classId as query params
        navigate(`/teacher/game-room?gameId=${selectedGame}&classId=${classId}`);
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
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'  // hoặc bỏ nếu muốn giờ địa phương
    }).format(date);
    };

    return (
        <>
        <Header />
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
                                    <div className="game-session-container">
                                        <h2 className="game-session-title">Game Sessions</h2>

                                        {loading ? (
                                            <p className="game-session-loading">Đang tải dữ liệu...</p>
                                        ) : error ? (
                                            <p className="game-session-error">{error}</p>
                                        ) : paginatedSessions.length === 0 ? (
                                            <p className="game-session-empty">Không có phiên nào.</p>
                                        ) : (
                                            <div className="game-session-grid">
                                            {paginatedSessions.map((session, index) => (
                                                <div
                                                key={index}
                                                className="game-session-card"
                                                onClick={() => handleSelectSession(session)}
                                                >
                                                <strong><p className="game-session-game">Game: {session.gameName}</p></strong>
                                                <p className="game-session-status">Status: {session.status}</p>
                                                <p className="game-session-date">Date: {formatDateTime(session.startTime)}</p>
                                                <p className="game-session-participants">
                                                    Participants: {session.participants?.length || 0}
                                                </p>
                                                </div>
                                            ))}
                                            </div>
                                        )}

                                        {totalPages > 1 && (
                                            <div className="game-session-pagination">
                                            <button
                                                onClick={prevPage}
                                                disabled={currentPage === 1}
                                                className="pagination-button"
                                            >
                                                Prev
                                            </button>
                                            <span className="pagination-current">{currentPage} / {totalPages}</span>
                                            <button
                                                onClick={nextPage}
                                                disabled={currentPage === totalPages}
                                                className="pagination-button"
                                            >
                                                Next
                                            </button>
                                            </div>
                                        )}


                                        {/* Selected session detail */}
                                            {selectedSession && (
                                            <div className="game-session-modal">
                                                <div className="game-session-modal__overlay">
                                                    <div className="game-session-modal__content">
                                                    <button 
                                                        onClick={() => setSelectedSession(null)} 
                                                        className="game-session-modal__close-btn"
                                                    >
                                                        ×
                                                    </button>
                                                    
                                                    {loadingHistory ? (
                                                        <div className="game-session-modal__loading">
                                                        <div className="game-session-modal__spinner"></div>
                                                        <p>Đang tải chi tiết phiên học...</p>
                                                        </div>
                                                    ) : selectedHistory ? (
                                                        <div className="game-session-details">
                                                        {/* Header Section */}
                                                        <div className="game-session-header">
                                                            <h2 className="game-session-title">
                                                            <span>Game:</span> {selectedSession.gameName}
                                                            </h2>
                                                            <div className="game-session-stats">
                                                            <div className="stat-card">
                                                                <span className="stat-card__label">Điểm trung bình lớp</span>
                                                                <span className="stat-card__value">{selectedHistory.classAverageScore}</span>
                                                            </div>
                                                            <div className="stat-card">
                                                                <span className="stat-card__label">Tỷ lệ tham gia</span>
                                                                <span className="stat-card__value">{selectedHistory.participationPercentage}%</span>
                                                            </div>
                                                            </div>
                                                        </div>

                                                        {/* Subject Progress Section */}
                                                        {subjectProgress && (
                                                            <div className="subject-progress">
                                                            <h4 className="section-title">
                                                                Tiến độ môn học
                                                            </h4>
                                                            
                                                            <div className="subject-progress__grid">
                                                                <div>
                                                                <p className="info-item"><span>Môn học:</span> {subjectProgress.subject}</p>
                                                                <p className="info-item"><span>Điểm trung bình:</span> {subjectProgress.averageScore.toFixed(2)}</p>
                                                                </div>
                                                                <div>
                                                                <p className="info-item"><span>Hoạt động hoàn thành:</span> {subjectProgress.totalActivitiesCompleted}</p>
                                                                <p className="info-item"><span>Lần hoạt động cuối:</span> {formatDateTime(subjectProgress.lastActivity)}</p>
                                                                </div>
                                                            </div>

                                                            {subjectProgress.topicScores && (
                                                                <div className="topics-section">
                                                                <h5 className="sub-section-title">Điểm theo chủ đề:</h5>
                                                                <div className="topics-container">
                                                                    {Object.entries(subjectProgress.topicScores).map(([topic, score]) => (
                                                                    <div key={topic} className="topic-item">
                                                                        <span className="topic-item__name">{topic}</span>
                                                                        <span className="topic-item__score">{score.toFixed(2)}</span>
                                                                    </div>
                                                                    ))}
                                                                </div>
                                                                </div>
                                                            )}
                                                            </div>
                                                        )}

                                                        {/* Student Performance Section */}
                                                        <div className="student-performance">
                                                            <h4 className="section-title">
                                                            Kết quả học sinh
                                                            </h4>
                                                            <div className="students-list">
                                                            {Object.entries(selectedHistory.studentPerformance).map(([studentId, perf]) => (
                                                                <div key={studentId} className="student-card">
                                                                <h5 className="student-card__id">{studentId}</h5>
                                                                <div className="student-card__stats">
                                                                    <p><span>Điểm:</span> {perf.totalScore}</p>
                                                                    <p><span>Đúng/Sai:</span> {perf.correctAnswers}/{perf.incorrectAnswers}</p>
                                                                    <p><span>Thời gian TB:</span> {perf.averageResponseTime}s</p>
                                                                    <p><span>Hoạt động:</span> Hoàn thành: {perf.completedActivities}, Bỏ qua: {perf.skippedActivities}</p>
                                                                </div>
                                                                </div>
                                                            ))}
                                                            </div>
                                                        </div>
                                                        </div>
                                                    ) : (
                                                        <p className="game-session-modal__empty">Không có dữ liệu chi tiết.</p>
                                                    )}
                                                    </div>
                                                </div>
                                            </div>
                                            )}

                                        </div>

                                )}

                                {activeTab === "quiz" && (
                                    <div>
                                        <div className="tab-header">
                                            <h3>Quiz Management</h3>
                                            <button
                                                className="action-button"
                                                onClick={() => navigate(`/games/edit/new?classId=${classId}`)}
                                            >
                                                Create Quiz
                                            </button>
                                        </div>

                                        {/* Start Game Section */}
                                        <div className="start-game-section mt-8 p-6 bg-white rounded-lg shadow-md">
                                            <h4 className="text-xl font-medium mb-4 flex items-center">
                                                <PlayCircle className="mr-2 text-blue-500" />
                                                Start a Game Session
                                            </h4>
                                            <p className="text-gray-600 mb-4">
                                                Start a game session with students in this class. Select a game from the list below.
                                            </p>

                                            <div className="game-selection mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select a Game:
                                                </label>
                                                <select
                                                    value={selectedGame}
                                                    onChange={(e) => setSelectedGame(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">-- Select a Game --</option>
                                                    {availableGames.map(game => (
                                                        <option key={game.id} value={game.id}>
                                                            {game.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                {availableGames.length === 0 && !gameLoading && (
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        No games available. Create a game first.
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={createGameSession}
                                                disabled={!selectedGame || gameLoading}
                                                className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${!selectedGame || gameLoading
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                    } transition-colors w-full`}
                                            >
                                                {gameLoading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlayCircle className="mr-2" />
                                                        Start Game
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Game list would go here */}
                                        <div className="mt-8">
                                            <h4 className="text-lg font-medium mb-4">Available Games</h4>
                                            {gameLoading ? (
                                                <div className="flex justify-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                </div>
                                            ) : availableGames.length === 0 ? (
                                                <div className="empty-message">No quizzes have been created for this class yet</div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {availableGames.map(game => (
                                                        <div key={game.id} className="p-4 border rounded-lg bg-white">
                                                            <h5 className="font-medium text-lg">{game.title}</h5>
                                                            <p className="text-gray-600 text-sm">{game.description || "No description"}</p>
                                                            <div className="mt-3 flex items-center">
                                                                <BookOpen className="text-blue-500 h-4 w-4 mr-1" />
                                                                <span className="text-sm">{game.questions?.length || 0} questions</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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