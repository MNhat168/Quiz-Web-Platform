import React, { useEffect, useState } from "react";
import { Clock, BookOpen, Target, Award, Trophy } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface GameSession {
  id: string;
  gameId: string;
  startTime: Date;
  endTime: Date;
  subject: string;
  completedActivities: {
    activityId: string;
    subject: string;
  }[];
  participants: {
    userId: string;
    totalScore: number;
  }[];
}

interface LearningProfile {
  subject: string;
  bestScore: number;
  totalSessions: number;
  lastPlayed: Date;
  status: 'IMPROVED' | 'DECLINED' | 'MAINTAINED';
}

interface SubjectStrength {
  subject: string;
  bestScore: number;
  totalSessions: number;
  averageScore: number;
  lastPlayed: Date;
}

interface SubjectWeakness {
  subject: string;
  bestScore: number;
  totalSessions: number;
  averageScore: number;
  lastPlayed: Date;
  improvementAreas: string[];
}

interface SubjectProgress {
  subject: string;
  bestScore: number;
  totalSessions: number;
  lastPlayed: Date;
}

interface StudentProgress {
  id: string;
  studentId: string;
  totalScore: number;
  totalSessions: number;
  lastActivityDate: Date;
  recentSessions: GameSession[];
  learningProfile: LearningProfile;
  subjectProgressList: SubjectProgress[];
  displayName?: string;
}

const API_BASE_URL = 'http://localhost:8080/api/student-progress';

// Add axios interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const ProfileStudent: React.FC = () => {
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get student email from token
  const getStudentEmail = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      return tokenPayload.sub;
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  };

  useEffect(() => {
    const fetchStudentProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          navigate('/login');
          return;
        }

        const studentEmail = getStudentEmail();
        if (!studentEmail) {
          setError('Could not determine student email');
          setLoading(false);
          navigate('/login');
          return;
        }

        // First update the progress
        await axios.post(
          `${API_BASE_URL}/${studentEmail}/update`,
          {},
          { withCredentials: true }
        );

        // Then get the updated progress
        const response = await axios.get(
          `${API_BASE_URL}/${studentEmail}`,
          { withCredentials: true }
        );

        if (response.data) {
          // Ensure dates are properly parsed and get subject name
          const progress = {
            ...response.data,
            lastActivityDate: new Date(response.data.lastActivityDate),
            recentSessions: response.data.recentSessions?.map((session: any) => ({
              ...session,
              startTime: new Date(session.startTime),
              endTime: new Date(session.endTime),
              subject: session.subject || 'No Subject'
            })) || [],
            subjectProgressList: response.data.subjectProgressList?.map((sp: any) => ({
              ...sp,
              lastPlayed: new Date(sp.lastPlayed)
            })) || [],
            learningProfile: response.data.learningProfile ? {
              ...response.data.learningProfile,
              lastPlayed: new Date(response.data.learningProfile.lastPlayed)
            } : {
              subject: 'No Subject',
              bestScore: 0,
              totalSessions: 0,
              lastPlayed: new Date(),
              status: 'MAINTAINED'
            }
          };
          setStudentProgress(progress);
          setError(null);
        } else {
          setError('No data received from server');
        }
      } catch (error: any) {
        console.error('Error details:', error.response?.data);
        if (error.response?.status === 403 || error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          setError('Authentication failed. Please log in again.');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch student progress');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!studentProgress) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No progress data available</p>
        </div>
      </div>
    );
  }

  // Helper function to get student's score from a session
  const getStudentScore = (session: GameSession) => {
    if (!session?.participants || !Array.isArray(session.participants)) {
      return 0;
    }
    const participant = session.participants.find(p => p.userId === studentProgress?.studentId);
    return participant?.totalScore || 0;
  };

  // Helper function to calculate rank
  const calculateRank = (session: GameSession) => {
    if (!session?.participants || !Array.isArray(session.participants)) {
      return 0;
    }
    const sortedParticipants = [...session.participants].sort((a, b) => b.totalScore - a.totalScore);
    const studentIndex = sortedParticipants.findIndex(p => p.userId === studentProgress?.studentId);
    return studentIndex + 1;
  };

  // Helper: Lấy các session trong 7 ngày gần nhất
  const getRecentWeekSessions = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return studentProgress.recentSessions.filter(
      (session) => new Date(session.endTime) >= oneWeekAgo
    );
  };

  // Tính lại Total Score trong 7 ngày gần nhất
  const getWeeklyTotalScore = () => {
    const weekSessions = getRecentWeekSessions();
    return weekSessions.reduce((sum, session) => sum + getStudentScore(session), 0);
  };

  // Tính lại Best Rank trong 7 ngày gần nhất
  const getWeeklyBestRank = () => {
    const weekSessions = getRecentWeekSessions();
    const ranks = weekSessions.map((session) => calculateRank(session)).filter((rank) => rank > 0);
    return ranks.length > 0 ? Math.min(...ranks) : 0;
  };

  return (
    <div className="!min-h-screen !p-6 !bg-gradient-to-br !from-blue-50 !via-white !to-purple-50">
      {/* Header */}
      <div className="!flex !justify-between !items-center !mb-6">
        <h1 className="!text-3xl !font-bold !text-indigo-700 !flex !items-center !animate-pulse">
          
         
        </h1>
        <span className="!text-indigo-600 !bg-white !px-5 !py-3 !rounded-xl !shadow-sm !border !border-indigo-100 !hover:shadow-md !transition-shadow !duration-300">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>
      
      {/* Main Content Grid */}
      <div className="!space-y-6">
        {/* Welcome Banner - Full Width */}
        <div className="!bg-gradient-to-r !from-indigo-50 !to-purple-50 !rounded-3xl !p-8 !flex !justify-between !items-center !shadow-md !border !border-indigo-100 !hover:shadow-lg !transition-all !duration-300">
          <div>
            <div className="!flex !items-center !mb-2">
              <div className="!w-8 !h-8 !bg-indigo-100 !rounded-full !flex !items-center !justify-center !mr-2 !animate-bounce">
                <span className="!text-indigo-500 !text-lg">👋</span>
              </div>
              <h2 className="!text-indigo-700 !text-3xl !font-bold">
                Welcome back, {studentProgress.displayName}!
              </h2>
            </div>
            <p className="!text-gray-700 !text-lg !ml-10">
              You've completed <span className="!font-bold !text-indigo-600 !bg-indigo-100 !px-2 !py-1 !rounded-full !hover:bg-indigo-200 !transition-colors !duration-300">{getRecentWeekSessions().length}</span> recent sessions with a total score of <span className="!font-bold !text-purple-600 !bg-purple-100 !px-2 !py-1 !rounded-full !hover:bg-purple-200 !transition-colors !duration-300">{getWeeklyTotalScore()}</span>!
            </p>
          </div>
          <img 
            src="/OBJECT 1.png" 
            alt="Student with laptop" 
            className="!h-48 !drop-shadow-lg !hover:scale-105 !transition-transform !duration-300"
          />
        </div>

        {/* Stats and Progress Grid */}
        <div className="!grid !grid-cols-12 !gap-6">
          {/* Left Column - Stats & Recent Sessions */}
          <div className="!col-span-8 !space-y-6">
            {/* Stats Overview */}
            <div className="!grid !grid-cols-2 !gap-6">
              <div className="!bg-white !rounded-xl !p-6 !shadow-sm !border !border-indigo-100 !hover:shadow-lg !hover:-translate-y-1 !transition-all !duration-300">
                <div className="!flex !items-center !mb-4">
                  <div className="!w-12 !h-12 !rounded-full !bg-indigo-100 !flex !items-center !justify-center !mr-3 !animate-pulse">
                    <Award className="!w-6 !h-6 !text-indigo-500" />
                  </div>
                  <h3 className="!text-indigo-700 !text-lg !font-medium">Total Score</h3>
                </div>
                <p className="!text-3xl !font-bold !text-indigo-600 !mb-2">
                  {studentProgress.totalScore}
                </p>
                <div className="!h-2 !bg-indigo-100 !rounded-full !overflow-hidden">
                  <div className="!h-full !bg-indigo-500 !rounded-full !progress-bar !transition-all !duration-1000" style={{width: `${Math.min(studentProgress.totalScore / 10, 100)}%`}}></div>
                </div>
              </div>

              <div className="!bg-white !rounded-xl !p-6 !shadow-sm !border !border-purple-100 !hover:shadow-lg !hover:-translate-y-1 !transition-all !duration-300">
                <div className="!flex !items-center !mb-4">
                  <div className="!w-12 !h-12 !rounded-full !bg-purple-100 !flex !items-center !justify-center !mr-3 !animate-pulse">
                    <Trophy className="!w-6 !h-6 !text-purple-500" />
                  </div>
                  <h3 className="!text-purple-700 !text-lg !font-medium">Best Rank</h3>
                </div>
                <p className="!text-3xl !font-bold !text-purple-600 !mb-2">
                  #{getWeeklyBestRank()}
                </p>
               
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="!bg-white !rounded-xl !p-6 !shadow-sm !border !border-indigo-100 !hover:shadow-lg !transition-all !duration-300">
              <h3 className="!text-indigo-700 !font-bold !text-xl !mb-4 !flex !items-center">
                <Clock className="!w-5 !h-5 !mr-2 !text-indigo-500 !animate-spin" />
                Recent Sessions
              </h3>
              <div className="!space-y-4">
                {studentProgress.recentSessions && Array.isArray(studentProgress.recentSessions) && 
                  studentProgress.recentSessions.map((session, index) => (
                    <div 
                      key={session.id} 
                      className="!p-4 !rounded-xl !bg-gradient-to-r !from-indigo-50 !to-white !border !border-indigo-100 !hover:border-indigo-300 !hover:shadow-md !hover:-translate-y-1 !transition-all !duration-300"
                    >
                      <div className="!flex !justify-between !items-center">
                        <div className="!flex !items-center">
                          <div className="!w-10 !h-10 !rounded-full !bg-indigo-100 !flex !items-center !justify-center !mr-3 !hover:scale-110 !transition-transform !duration-300">
                            <span className="!text-indigo-500">{session.subject === 'Math' ? '📊' : session.subject === 'Science' ? '🔬' : session.subject === 'English' ? '📝' : '📚'}</span>
                          </div>
                          <div>
                            <h4 className="!font-medium !text-indigo-700">
                              {session.subject || 'No Subject'}
                            </h4>
                            <p className="!text-sm !text-gray-500">
                              {new Date(session.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="!flex !items-center !space-x-6">
                          <div className="!text-center">
                            <p className="!text-xs !text-gray-500">Score</p>
                            <p className="!font-bold !text-indigo-600 !text-lg !hover:text-indigo-700 !transition-colors !duration-300">{getStudentScore(session)}</p>
                          </div>
                          <div className="!text-center">
                            <p className="!text-xs !text-gray-500">Rank</p>
                            <p className="!font-bold !text-purple-600 !text-lg !hover:text-purple-700 !transition-colors !duration-300">#{calculateRank(session)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Column - Subject Progress */}
          <div className="!col-span-4">
            <div className="!bg-white !rounded-xl !p-6 !shadow-sm !border !border-indigo-100 !hover:shadow-lg !transition-all !duration-300">
              <h3 className="!text-indigo-700 !font-bold !text-xl !mb-4 !flex !items-center">
                <Target className="!w-5 !h-5 !mr-2 !text-indigo-500 !animate-pulse" />
                Subject Progress
              </h3>
              <div className="!space-y-4">
                {studentProgress.subjectProgressList && studentProgress.subjectProgressList.length > 0 ? (
                  studentProgress.subjectProgressList.map((sp, idx) => {
                    const subjectSessions = studentProgress.recentSessions
                      .filter(s => s.subject === sp.subject)
                      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
                    const lastSession = subjectSessions[0];
                    const lastScore = lastSession ? getStudentScore(lastSession) : 0;
                    let prevBest = 0;
                    if (subjectSessions.length > 1) {
                      const prevScores = subjectSessions.slice(1).map(s => getStudentScore(s));
                      prevBest = prevScores.length > 0 ? Math.max(...prevScores) : 0;
                    }
                    let eduMsg = '';
                    let eduColor = '';
                    let eduIcon: string = '';
                    if (lastScore === sp.bestScore && lastScore > prevBest && lastScore !== 0) {
                      eduMsg = 'Congratulations! New high score!';
                      eduColor = '!text-green-600';
                      eduIcon = '🎉';
                    } else if (lastScore === sp.bestScore && lastScore === prevBest && lastScore !== 0) {
                      eduMsg = 'Maintaining your best performance!';
                      eduColor = '!text-blue-600';
                      eduIcon = '👍';
                    } else if (lastScore < sp.bestScore && lastScore !== 0) {
                      eduMsg = 'Keep trying to beat your best!';
                      eduColor = '!text-amber-600';
                      eduIcon = '💪';
                    } else {
                      eduMsg = 'Start practicing to improve!';
                      eduColor = '!text-gray-500';
                      eduIcon = '📚';
                    }
                    return (
                      <div 
                        key={idx} 
                        className="!bg-gradient-to-r !from-indigo-50 !to-purple-50 !p-4 !rounded-xl !border !border-indigo-100 !hover:shadow-md !hover:-translate-y-1 !transition-all !duration-300"
                      >
                        <div className="!flex !justify-between !items-center !mb-2">
                          <div className="!flex !items-center">
                            <div className="!w-8 !h-8 !rounded-full !bg-indigo-100 !flex !items-center !justify-center !mr-2 !hover:scale-110 !transition-transform !duration-300">
                              <span className="!text-indigo-500">{sp.subject === 'Math' ? '📊' : sp.subject === 'Science' ? '🔬' : sp.subject === 'English' ? '📝' : '📚'}</span>
                            </div>
                            <span className="!font-medium !text-indigo-700">{sp.subject}</span>
                          </div>
                        </div>
                        <div className="!flex !justify-between !items-center !mb-2">
                          <div className="!flex !items-center">
                            <Trophy className="!w-4 !h-4 !text-yellow-500 !mr-1 !animate-bounce" />
                            <span className="!text-sm !text-gray-600">Best: <span className="!font-bold !text-indigo-600">{sp.bestScore}</span></span>
                          </div>
                          <div className="!flex !items-center">
                            <span className="!text-sm !text-gray-600">Last: <span className="!font-bold !text-green-600">{lastScore}</span></span>
                          </div>
                        </div>
                        <div className="!flex !items-center !mb-2">
                          <span className="!text-lg !mr-2 !animate-pulse">{eduIcon}</span>
                          <p className={`!text-sm !font-medium ${eduColor}`}>{eduMsg}</p>
                        </div>
                        <div className="!h-2 !bg-indigo-100 !rounded-full !overflow-hidden">
                          <div 
                            className="!h-full !bg-gradient-to-r !from-indigo-500 !to-purple-500 !rounded-full !progress-bar !transition-all !duration-1000" 
                            style={{width: `${Math.min(Math.round((lastScore / 100) * 100), 100)}%`}}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="!bg-indigo-50 !p-6 !rounded-xl !text-center !hover:bg-indigo-100 !transition-colors !duration-300">
                    <p className="!text-indigo-700 !font-medium">No subject data available.</p>
                    <p className="!text-indigo-500 !text-sm !mt-1">Start a session to see your progress!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileStudent; 