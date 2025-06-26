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
    <>
    {/* Background image - restored */}
    <div
    className="!fixed !inset-0 !z-0"
    style={{
    backgroundImage: "url('/spiritedaway-bg.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    }}
    />
    
    ```plaintext
    {/* Magical floating particles overlay */}
    <div className="!fixed !inset-0 !z-5 !pointer-events-none">
      <div className="!absolute !top-[20%] !left-[10%] !w-2 !h-2 !bg-yellow-300/60 !rounded-full !animate-float-magical" style={{ animationDelay: '0s' }}></div>
      <div className="!absolute !top-[30%] !right-[15%] !w-1.5 !h-1.5 !bg-orange-300/50 !rounded-full !animate-float-magical" style={{ animationDelay: '2s' }}></div>
      <div className="!absolute !bottom-[40%] !left-[20%] !w-1 !h-1 !bg-red-300/40 !rounded-full !animate-float-magical" style={{ animationDelay: '4s' }}></div>
      <div className="!absolute !bottom-[60%] !right-[25%] !w-2.5 !h-2.5 !bg-pink-300/30 !rounded-full !animate-float-magical" style={{ animationDelay: '6s' }}></div>
    </div>
    
    <div className="!relative !z-10 !min-h-screen !p-4">
      {/* Traditional paper lantern date display */}
      <div className="!absolute !top-6 !right-6 !z-20">
        <div className="!relative">
          {/* Lantern body */}
          <div className="!bg-gradient-to-b !from-red-400/90 !to-red-600/90 !backdrop-blur-sm !px-6 !py-4 !rounded-full !border-4 !border-yellow-400/80 !shadow-2xl !relative">
            {/* Lantern glow effect */}
            <div className="!absolute !inset-0 !bg-yellow-300/20 !rounded-full !blur-md !animate-pulse-glow"></div>
            {/* Lantern top */}
            <div className="!absolute !-top-3 !left-1/2 !transform !-translate-x-1/2 !w-8 !h-3 !bg-yellow-600/90 !rounded-t-full !border-2 !border-yellow-400"></div>
            {/* Lantern bottom tassel */}
            <div className="!absolute !-bottom-4 !left-1/2 !transform !-translate-x-1/2 !w-1 !h-4 !bg-yellow-600/80"></div>
            <div className="!absolute !-bottom-6 !left-1/2 !transform !-translate-x-1/2 !w-3 !h-2 !bg-yellow-500/80 !rounded-full"></div>
            
            <div className="!text-yellow-100 !font-bold !text-sm !drop-shadow-lg !relative !z-10 !text-center">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>
   {/* vo dien */}
      <div className="!absolute !top-[320px] !left-[-190px] ">
        <img
          src="/vodien.png"
          alt="no-face"
          className="!w-90 !h-100  !rotate-170 !opacity-75"
          style={{ transform: 'rotateX(160deg)' }}
        />
      </div>
   {/* gold */}
      <div className="!absolute !top-[549px] !left-[-80px] ">
        <img
          src="/gold2.png"
          alt="no-face"
          className="!w-45 !h-22 !filter !brightness-140   "
      
        />
      </div>

      

      
      {/* rat */}
      <div className="!absolute !top-[405px] !left-[160px] !z-21">
        <img
          src="/rat.png"
          alt="no-face"
          className="!w-22  !h-19  !filter !brightness-140   "
      
        />
      </div>

         {/* haku */}
         <div className="!absolute !bottom-[600px] !left-[-73px] ">
        <img
          src="/haku.png"
          alt="no-face"
          className="!w-60 !h-45   !filter !brightness-130 "
     
        />
        <div className="!absolute !top-6 !right-[-140px] !bg-yellow-50/95 !px-5 !py-4 !border-3 !border-amber-800/80 !shadow-xl !max-w-[220px] !transform !rotate-2">
            <div className="!text-amber-900 !font-bold !text-sm !leading-relaxed">
              KHÔNG HỌC LÀ BỊ BIẾN THÀNH HEO ĐÓ, {studentProgress.displayName}!
            </div>
            <div className="!absolute !left-[-12px] !top-6 !w-0 !h-0 !border-t-[10px] !border-t-transparent !border-b-[10px] !border-b-transparent !border-r-[15px] !border-r-yellow-50/95"></div>
            {/* Traditional corner decorations */}
          
          </div>
        </div>

    
      {/* Chihiro welcome with traditional speech bubble */}
      <div className="!absolute !top-95 !right-220 !z-20 !min-w-[500px]">
        <div className="!flex !items-start">
          <img 
            src="/chihiro.png" 
            alt="chihiro" 
            className="!h-100 !w-500  !drop-shadow-2xl !filter !brightness-110 !animate-gentle-sway"
          />
       
        </div>
      </div>
    
      {/* Main content - traditional Japanese building layout */}
      <div className="!pt-20 !pb-6 !h-[calc(100vh-100px)] !flex !gap-6">
        
        {/* Left Column - Traditional Shrine Stats */}
        <div className="!flex-shrink-0 !w-52 !space-y-6">
          {/* Total Score Shrine */}
          <div className="!relative !transform !-rotate-2 !animate-gentle-float">
            <div className="!relative !bg-gradient-to-b !from-red-300/85 !to-red-500/85 !backdrop-blur-sm !rounded-t-3xl !rounded-b-2xl !p-5 !border-4 !border-yellow-600/70 !shadow-2xl">
             
              {/* Hanging lanterns */}
              <div className="!absolute !top-[-8px] !left-4 !w-3 !h-5 !bg-yellow-500/80 !rounded-full !border-2 !border-red-600/60 !animate-gentle-swing"></div>
              <div className="!absolute !top-[-8px] !right-4 !w-3 !h-5 !bg-yellow-500/80 !rounded-full !border-2 !border-red-600/60 !animate-gentle-swing" style={{ animationDelay: '1s' }}></div>
              
              <div className="!text-center !relative !z-10">
                <div className="!w-8 !h-8 !mx-auto !mb-2 !text-yellow-200 !text-2xl !drop-shadow-lg !animate-gentle-glow">🏆</div>
                <div className="!text-yellow-100 !font-bold !text-sm !mb-2 !drop-shadow-md">Total Score</div>
                <div className="!text-2xl !font-bold !text-yellow-100 !drop-shadow-lg !animate-number-glow">
                  {studentProgress.totalScore}
                </div>
              </div>
            </div>
          </div>
    
          {/* Best Rank Shrine */}
          <div className="!relative !transform !rotate-1 !animate-gentle-float" style={{ animationDelay: '2s' }}>
            <div className="!relative !bg-gradient-to-b !from-orange-300/85 !to-orange-500/85 !backdrop-blur-sm !rounded-t-3xl !rounded-b-2xl !p-5 !border-4 !border-red-600/70 !shadow-2xl">
              {/* Traditional curved roof */}
              <div className="!absolute !top-[-20px] !left-1/2 !transform !-translate-x-1/2 !w-0 !h-0 !border-l-[35px] !border-l-transparent !border-r-[35px] !border-r-transparent !border-b-[20px] !border-b-red-800/90"></div>
              {/* Roof decorative ridge */}
              <div className="!absolute !top-[-25px] !left-1/2 !transform !-translate-x-1/2 !w-16 !h-2 !bg-red-700/80 !rounded-full"></div>
              
              {/* Hanging lanterns */}
              <div className="!absolute !top-[-8px] !left-4 !w-3 !h-5 !bg-red-500/80 !rounded-full !border-2 !border-yellow-600/60 !animate-gentle-swing"></div>
              <div className="!absolute !top-[-8px] !right-4 !w-3 !h-5 !bg-red-500/80 !rounded-full !border-2 !border-yellow-600/60 !animate-gentle-swing" style={{ animationDelay: '1.5s' }}></div>
              
              <div className="!text-center !relative !z-10">
                <div className="!w-8 !h-8 !mx-auto !mb-2 !text-red-100 !text-2xl !drop-shadow-lg !animate-gentle-glow">👑</div>
                <div className="!text-red-100 !font-bold !text-sm !mb-2 !drop-shadow-md">Best Rank</div>
                <div className="!text-2xl !font-bold !text-red-100 !drop-shadow-lg !animate-number-glow">
                  #{getWeeklyBestRank()}
                </div>
              </div>
            </div>
          </div>
        </div>
    
        {/* Center Column - Main Bathhouse Building */}
        <div className="!flex-1 !max-w-3xl">
          <div className="!relative !h-full !transform !rotate-0 !animate-gentle-float min-w-0" style={{ animationDelay: '1s' }}>
            <div className="!relative !bg-gradient-to-b !from-amber-200/80 !to-orange-300/80 !backdrop-blur-md !rounded-t-[2rem] !rounded-b-3xl !p-8 !border-4 !border-red-700/60 !shadow-2xl !flex flex-col">
      
              {/* Traditional corner lanterns */}
              <div className="!absolute !top-[-15px] !left-12 !w-5 !h-8 !bg-gradient-to-b !from-red-500/90 !to-red-700/90 !rounded-full !border-3 !border-yellow-400/70 !animate-lantern-glow"></div>
              <div className="!absolute !top-[-15px] !right-12 !w-5 !h-8 !bg-gradient-to-b !from-red-500/90 !to-red-700/90 !rounded-full !border-3 !border-yellow-400/70 !animate-lantern-glow" style={{ animationDelay: '3s' }}></div>
              
              {/* Building pillars */}
              <div className="!absolute !left-4 !top-8 !bottom-8 !w-2 !bg-amber-800/60 !rounded-full"></div>
              <div className="!absolute !right-4 !top-8 !bottom-8 !w-2 !bg-amber-800/60 !rounded-full"></div>
    
              <h3 className="!text-red-900 !font-bold !text-3xl !mb-8 !flex !items-center !justify-center !drop-shadow-2xl !relative !z-10">
                <span className="!text-4xl !mr-4 !filter !drop-shadow-lg !animate-gentle-glow">🕐</span>
                <div className="!text-center">
                  <div className="!text-red-800 !text-2xl">Recent Sessions</div>
                </div>
              </h3>
    
              <div
                className="space-y-3 relative z-10 pr-3"
              >
                {studentProgress.recentSessions && Array.isArray(studentProgress.recentSessions) && 
                  studentProgress.recentSessions.map((session, index) => (
                    <div 
                      key={session.id} 
                      className="!relative !bg-gradient-to-r !from-white/70 !to-amber-50/70 !backdrop-blur-sm !p-4 !rounded-2xl !border-3 !border-orange-400/50 !shadow-lg !hover:shadow-xl !hover:scale-[1.02] !transition-all !duration-500 !transform !hover:-rotate-1"
                    >
                      {/* Traditional paper texture overlay */}
                      <div className="!absolute !inset-0 !bg-gradient-to-br !from-transparent !via-amber-100/20 !to-orange-200/20 !rounded-2xl"></div>
                      
                      <div className="!flex !justify-between !items-center !relative !z-10">
                        <div className="!flex !items-center">
                          <div className="!w-12 !h-12 !rounded-full !bg-gradient-to-br !from-orange-300/90 !to-red-400/90 !flex !items-center !justify-center !mr-4 !border-3 !border-yellow-500/60 !shadow-md">
                            <span className="!text-yellow-100 !text-xl !drop-shadow-md">{session.subject === 'Math' ? '🧮' : session.subject === 'Science' ? '⚗️' : session.subject === 'English' ? '📜' : '📚'}</span>
                          </div>
                          <div>
                            <h4 className="!font-bold !text-red-900 !text-lg !drop-shadow-sm break-words">
                              {session.subject || 'No Subject'}
                            </h4>
                            <p className="!text-sm !text-red-700/80">
                              {new Date(session.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="!flex !items-center !space-x-4">
                          <div className="!text-center !bg-gradient-to-b !from-yellow-200/80 !to-amber-300/80 !px-3 !py-2 !rounded-xl !border-2 !border-yellow-500/50 !shadow-md">
                            <p className="!text-xs !text-amber-900 !font-bold">Score</p>
                            <p className="!font-bold !text-amber-900 !text-lg !drop-shadow-sm">{getStudentScore(session)}</p>
                          </div>
                          <div className="!text-center !bg-gradient-to-b !from-red-200/80 !to-red-400/80 !px-3 !py-2 !rounded-xl !border-2 !border-red-500/50 !shadow-md">
                            <p className="!text-xs !text-red-100 !font-bold">Rank</p>
                            <p className="!font-bold !text-red-100 !text-lg !drop-shadow-sm">#{calculateRank(session)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
    
        {/* Right Column - Traditional Study Pagoda */}
        <div className="!flex-shrink-0 !w-80">
          <div className="!relative !h-full !transform !rotate-1 !animate-gentle-float min-w-0 !z-10" style={{ animationDelay: '3s' }}>
            <div className="!relative !bg-gradient-to-b !from-yellow-200/80 !to-amber-300/80 !backdrop-blur-md !rounded-t-[2rem] !rounded-b-3xl !p-6 !border-4 !border-orange-600/60 !shadow-2xl !flex flex-col">
             
              
              <h3 className="!text-orange-900 !font-bold !text-xl !mb-6 !flex !items-center !justify-center !drop-shadow-lg !relative !z-10">
                <span className="!text-2xl !mr-3 !animate-gentle-glow">🎯</span>
                <div className="!text-center">
                  <div className="!text-orange-800 !text-lg">Subject Progress</div>
                </div>
              </h3>
    
              <div
                className={`space-y-3 relative z-10 pr-3 ${
                  studentProgress.subjectProgressList && studentProgress.subjectProgressList.length > 3
                    ? 'max-h-[60vh] overflow-y-auto' : ''
                }`}
              >
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
                      eduMsg = 'New Record!';
                      eduColor = '!text-red-800';
                      eduIcon = '🌸';
                    } else if (lastScore === sp.bestScore && lastScore === prevBest && lastScore !== 0) {
                      eduMsg = 'Excellent!';
                      eduColor = '!text-orange-800';
                      eduIcon = '🎋';
                    } else if (lastScore < sp.bestScore && lastScore !== 0) {
                      eduMsg = 'Keep going!';
                      eduColor = '!text-amber-800';
                      eduIcon = '🍃';
                    } else {
                      eduMsg = 'Start practicing!';
                      eduColor = '!text-yellow-800';
                      eduIcon = '🌿';
                    }
                    
                    return (
                      <div 
                        key={idx} 
                        className="!relative !bg-gradient-to-br !from-white/80 !to-yellow-50/80 !backdrop-blur-sm !p-4 !rounded-2xl !border-3 !border-amber-400/50 !shadow-lg !hover:shadow-xl !transition-all !duration-500 !transform !hover:scale-105"
                      >
                        {/* Traditional scroll texture */}
                        <div className="!absolute !inset-0 !bg-gradient-to-br !from-transparent !via-amber-100/30 !to-yellow-200/30 !rounded-2xl"></div>
                        
                        <div className="!relative !z-10">
                          <div className="!flex !items-center !justify-between !mb-3">
                            <div className="!flex !items-center">
                              <div className="!w-8 !h-8 !rounded-full !bg-gradient-to-br !from-amber-300/90 !to-orange-400/90 !flex !items-center !justify-center !mr-3 !border-2 !border-yellow-500/60 !shadow-md">
                                <span className="!text-yellow-100 !text-sm !drop-shadow-sm">{sp.subject === 'Math' ? '🧮' : sp.subject === 'Science' ? '⚗️' : sp.subject === 'English' ? '📜' : '📚'}</span>
                              </div>
                              <span className="!font-bold !text-amber-900 !text-lg !drop-shadow-sm break-words">{sp.subject}</span>
                            </div>
                          </div>
                          
                          <div className="!flex !justify-between !text-sm !mb-3 !bg-amber-100/50 !p-2 !rounded-lg">
                            <span className="!text-amber-900">Best: <strong>{sp.bestScore}</strong></span>
                            <span className="!text-amber-900">Last: <strong>{lastScore}</strong></span>
                          </div>
                          
                          <div className="!flex !items-center !mb-3 !bg-white/60 !p-2 !rounded-lg">
                            <span className="!text-lg !mr-2 !animate-gentle-glow">{eduIcon}</span>
                            <p className={`!text-xs !font-bold ${eduColor}`}>{eduMsg}</p>
                          </div>
                          
                          <div className="!relative !h-3 !bg-amber-200/60 !rounded-full !overflow-hidden !border-2 !border-amber-400/40">
                            <div 
                              className="!h-full !bg-gradient-to-r !from-amber-500 !to-orange-600 !rounded-full !transition-all !duration-1000 !shadow-inner !animate-progress-glow" 
                              style={{width: `${Math.min(Math.round((lastScore / 100) * 100), 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="!bg-gradient-to-br !from-white/80 !to-amber-50/80 !p-4 !rounded-2xl !text-center !border-3 !border-amber-400/50 !shadow-lg">
                    <div className="!text-3xl !mb-2 !animate-gentle-glow">📚</div>
                    <p className="!text-amber-900 !font-bold !text-sm !mb-1">No subject data available</p>
                    <p className="!text-amber-700 !text-xs !mt-1">Start a session to see progress!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
      {/* Chihiro2 resting in corner with traditional mat */}
      <div className="!absolute !bottom-153 !right-160 ">
        <div className="!relative">
          <img 
            src="/chihiro2.png" 
            alt="chihiro2" 
            className="!h-30  !brightness-110 !transform !rotate-9 !relative !z-10 !animate-gentle-rest"
          />
        </div>
      </div>

       {/* Lin */}
       <div className="!absolute !bottom-151   !right-40 !z-0">
        <div className="!relative">
          <img 
            src="/lin.png" 
            alt="chihiro2" 
            className="!h-40 !w-42 !brightness-110 !rotate-180  !relative  !animate-gentle-rest"
            style={{ transform: 'rotateX(180deg)' }}
          />
        </div>
      </div>

    </div>
    
    {/* Custom Ghibli-style animations */}
    <style >{`
      @keyframes float-magical {
        0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
        25% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
        50% { transform: translateY(-10px) scale(0.8); opacity: 1; }
        75% { transform: translateY(-30px) scale(1.1); opacity: 0.6; }
      }
      @keyframes gentle-float {
        0%, 100% { transform: translateY(0px) rotate(var(--rotation, 0deg)); }
        50% { transform: translateY(-8px) rotate(var(--rotation, 0deg)); }
      }
      @keyframes gentle-sway {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(2deg); }
      }
      @keyframes gentle-swing {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }
      @keyframes gentle-glow {
        0%, 100% { filter: brightness(1) drop-shadow(0 0 5px rgba(255, 255, 0, 0.3)); }
        50% { filter: brightness(1.2) drop-shadow(0 0 15px rgba(255, 255, 0, 0.6)); }
      }
      @keyframes lantern-glow {
        0%, 100% { box-shadow: 0 0 10px rgba(255, 255, 0, 0.4); }
        50% { box-shadow: 0 0 20px rgba(255, 255, 0, 0.8); }
      }
      @keyframes number-glow {
        0%, 100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
        50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.8); }
      }
      @keyframes progress-glow {
        0%, 100% { box-shadow: inset 0 0 5px rgba(255, 165, 0, 0.5); }
        50% { box-shadow: inset 0 0 15px rgba(255, 165, 0, 0.8); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.7; }
      }
      @keyframes gentle-rest {
        0%, 100% { transform: rotate(12deg) translateY(0px); }
        50% { transform: rotate(12deg) translateY(-3px); }
      }
    
      .animate-float-magical { animation: float-magical 8s ease-in-out infinite; }
      .animate-gentle-float { animation: gentle-float 6s ease-in-out infinite; }
      .animate-gentle-sway { animation: gentle-sway 4s ease-in-out infinite; }
      .animate-gentle-swing { animation: gentle-swing 3s ease-in-out infinite; }
      .animate-gentle-glow { animation: gentle-glow 3s ease-in-out infinite; }
      .animate-lantern-glow { animation: lantern-glow 4s ease-in-out infinite; }
      .animate-number-glow { animation: number-glow 2s ease-in-out infinite; }
      .animate-progress-glow { animation: progress-glow 3s ease-in-out infinite; }
      .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
      .animate-gentle-rest { animation: gentle-rest 5s ease-in-out infinite; }
    `}</style>
    
    
    </>
    );
}

export default ProfileStudent; 