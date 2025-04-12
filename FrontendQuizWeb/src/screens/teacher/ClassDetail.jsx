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
            <Sidebar />
            <div className="max-w-7xl mx-auto p-4">
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

                <div className="bg-blue-500 rounded-t-lg text-white p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">
                                {classData?.name || "Class"}
                            </h1>
                            <div className="flex items-center text-sm text-white/80">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                    {classData?.createdAt ? formatDate(classData.createdAt) : "No date available"}
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={toggleShowCode}
                                className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-md px-3 py-1.5 flex items-center"
                            >
                                {isCodeVisible ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-1" />
                                        Hide Code
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-1" />
                                        Show Code
                                    </>
                                )}
                            </button>

                            <button
                                onClick={markAttendance}
                                className="bg-white text-blue-600 text-sm font-medium rounded-md px-3 py-1.5 flex items-center"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Attendance
                            </button>
                        </div>
                    </div>

                    {isCodeVisible && (
                        <div className="mt-4 bg-white/10 p-3 rounded-md flex items-center justify-between">
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

                    <div className="flex items-center mt-4 space-x-1">
                        <span className="text-sm">Members</span>
                        <button className="bg-white/10 hover:bg-white/20 text-white text-xs rounded-md px-2 py-1">
                            Invite
                        </button>
                        <div className="flex -space-x-2 ml-2">
                            {students.slice(0, 5).map((student, index) => (
                                <div key={index} className={`w-8 h-8 rounded-full bg-${['orange', 'green', 'purple', 'red', 'blue'][index % 5]}-400 border-2 border-blue-500 flex items-center justify-center text-xs font-bold`}>
                                    {student.name ? `${student.name.charAt(0)}${student.name.split(' ')[1]?.charAt(0) || ''}` : 'U'}
                                </div>
                            ))}
                            {students.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                                    +{students.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div className="w-3/4 bg-white border-r border-gray-200">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === "students"
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    onClick={() => setActiveTab("students")}
                                >
                                    Students
                                </button>
                                <button
                                    className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === "attendance"
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    onClick={() => setActiveTab("attendance")}
                                >
                                    Attendance
                                </button>
                                <button
                                    className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === "quiz"
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    onClick={() => setActiveTab("quiz")}
                                >
                                    Quiz
                                </button>
                            </nav>
                        </div>

                        <div className="p-4">
                            {activeTab === "students" && (
                                <div>
                                    {students.length > 0 ? (
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <th className="px-6 py-3">Name/Email</th>
                                                    <th className="px-6 py-3">Status</th>
                                                    <th className="px-6 py-3">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {students.map((student, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <img
                                                                    src={`/api/placeholder/40/40`}
                                                                    alt="Student"
                                                                    className="w-10 h-10 rounded-full mr-3"
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {student.name || student.username || "Unknown Student"}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {student.email || "No email available"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                                {student.status || "Active"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => removeStudent(student.id)}
                                                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No students have joined this class yet.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "attendance" && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
                                        <button className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
                                            Take Attendance
                                        </button>
                                    </div>
                                    <div className="text-center text-gray-500 py-8">
                                        Attendance reports will be shown here
                                    </div>
                                </div>
                            )}

                            {activeTab === "quiz" && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Quiz Management</h3>
                                        <button className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
                                            Create Quiz
                                        </button>
                                    </div>
                                    <div className="text-center text-gray-500 py-8">
                                        No quizzes have been created for this class yet
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-1/4 bg-gray-50 p-4">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-900">Tutors</h3>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">In Progress</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img
                                            src={`/api/placeholder/40/40`}
                                            alt="Tutor"
                                            className="w-10 h-10 rounded-full mr-3"
                                        />
                                        <div>
                                            <div className="font-medium">Teacher Name</div>
                                            <div className="text-xs text-gray-500">Lead Tutor</div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-4 bg-blue-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-gray-900 text-center">Leaderboard</h3>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                                <div className="border-b border-gray-100 p-2">
                                    <div className="flex justify-center gap-6">
                                        <button className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">Weekly</button>
                                        <button className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded-md text-sm">All Time</button>
                                    </div>
                                </div>
                                <div className="p-2">
                                    {leaderboardData.length > 0 ? (
                                        leaderboardData.map((student, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                <div className="flex items-center">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2">
                                                        {index + 1}
                                                    </div>
                                                    <img
                                                        src={`/api/placeholder/32/32`}
                                                        alt={student.name}
                                                        className="w-8 h-8 rounded-full mr-2"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium">{student.name}</div>
                                                        <div className="text-xs text-gray-500">{student.points} points</div>
                                                    </div>
                                                </div>
                                                <div className="w-6 h-6">
                                                    {index === 0 && (
                                                        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                                            <Trophy className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                    {index === 1 && (
                                                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                            <Trophy className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                    {index === 2 && (
                                                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                                                            <Trophy className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            No leaderboard data available
                                        </div>
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